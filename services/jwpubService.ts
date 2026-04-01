import JSZip from "jszip";
import initSqlJs from "sql.js";
import pako from "pako";
import { JwpubPublication, JwpubChapter, JwpubImage } from "@/types/jwpub";
import { indexedDbService } from "./indexedDbService";

const SQL_JS_WASM_URL = "https://unpkg.com/sql.js@1.14.1/dist/sql-wasm.wasm";

async function getEncryptionKeys(db: any): Promise<{ key: CryptoKey; iv: Uint8Array } | null> {
  try {
    const res = db.exec("SELECT MepsLanguageIndex, Symbol, Year, IssueTagNumber FROM Publication");
    if (res.length === 0 || res[0].values.length === 0) return null;

    const row = res[0].values[0];
    const mepsLanguageIndex = row[0];
    const symbol = row[1];
    const year = row[2];
    const issueTagNumber = row[3];

    let hashString = `${mepsLanguageIndex}_${symbol}_${year}`;
    if (issueTagNumber && Number(issueTagNumber) !== 0) {
      hashString += `_${issueTagNumber}`;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data as any);
    const hashArray = new Uint8Array(hashBuffer);

    const constantHex = "11cbb5587e32846d4c26790c633da289f66fe5842a3a585ce1bc3a294af5ada7";
    const constantBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      constantBytes[i] = parseInt(constantHex.substring(i * 2, i * 2 + 2), 16);
    }

    const derivedKey = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      derivedKey[i] = hashArray[i] ^ constantBytes[i];
    }

    const aesKeyBytes = derivedKey.slice(0, 16);
    const iv = derivedKey.slice(16, 32);

    const key = await crypto.subtle.importKey(
      "raw",
      aesKeyBytes as any,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    return { key, iv };
  } catch (err) {
    console.warn("Could not derive encryption keys:", err);
    return null;
  }
}

export const jwpubService = {
  async processFile(file: File): Promise<JwpubPublication> {
    const zip = await JSZip.loadAsync(file);
    let dbFiles: string[] = [];
    const allZipEntries: Record<string, JSZip.JSZipObject> = {};

    zip.forEach((relativePath, zipEntry) => {
      const fileName = relativePath.split("/").pop()!;
      if (!zipEntry.dir) allZipEntries[fileName] = zipEntry;
      if (!zipEntry.dir && relativePath.endsWith(".db") && !relativePath.includes("manifest") && !relativePath.includes("catalog")) {
        dbFiles.push(relativePath);
      }
    });

    let dbZipEntry;

    if (dbFiles.length === 0) {
      const contentsEntry = zip.file("contents");
      if (contentsEntry) {
        const contentsData = await contentsEntry.async("uint8array");
        const innerZip = await JSZip.loadAsync(contentsData);
        innerZip.forEach((relativePath, innerZipEntry) => {
          const fileName = relativePath.split("/").pop()!;
          if (!innerZipEntry.dir) allZipEntries[fileName] = innerZipEntry;
          if (!innerZipEntry.dir && relativePath.endsWith(".db") && !relativePath.includes("manifest") && !relativePath.includes("catalog")) {
            dbZipEntry = innerZipEntry;
          }
        });
      }
    } else {
      dbZipEntry = zip.file(dbFiles[0]);
    }

    if (!dbZipEntry) throw new Error("Could not find SQLite database in JWPUB.");

    const dbData = await dbZipEntry.async("uint8array");
    const SQL = await initSqlJs({
      locateFile: () => SQL_JS_WASM_URL
    });
    const db = new SQL.Database(dbData);

    const cryptoKeys = await getEncryptionKeys(db);

    // Get basic metadata
    const pubRes = db.exec("SELECT Symbol, Title FROM Publication");
    const symbol = pubRes[0].values[0][0] as string;
    const title = pubRes[0].values[0][1] as string;

    const chapters: JwpubChapter[] = [];
    const footnotes: Record<string, string> = {};

    try {
      const res = db.exec("SELECT DocumentId, Title, Content FROM Document ORDER BY DocumentId");
      if (res.length > 0) {
        for (const row of res[0].values) {
          const docId = String(row[0]);
          const docTitle = row[1] ? String(row[1]) : `Chapter ${docId}`;
          let content = "";

          if (row[2] instanceof Uint8Array) {
            let bytes = row[2];
            if (cryptoKeys && bytes.length > 0 && bytes[0] !== 0x3c) {
               const decryptedBuffer = await crypto.subtle.decrypt(
                 { name: "AES-CBC", iv: cryptoKeys.iv as any },
                 cryptoKeys.key,
                 bytes as any
               );
               bytes = pako.inflate(new Uint8Array(decryptedBuffer));
            } else if (bytes.length > 0 && bytes[0] !== 0x3c) {
               try { bytes = pako.inflate(bytes); } catch(e){}
            }
            content = new TextDecoder().decode(bytes);
          } else {
            content = String(row[2]);
          }

          // Inject data-pid attributes for paragraph tracking
          const { processedHtml, paragraphs: pMeta } = this.processContentHtml(content);

          chapters.push({
            id: docId,
            title: docTitle,
            html: processedHtml,
            paragraphs: pMeta,
          });
        }
      }

      // Fetch Footnotes if available
      try {
        const footRes = db.exec("SELECT FootnoteId, Content FROM Footnote");
        if (footRes.length > 0) {
          for (const row of footRes[0].values) {
            const fId = String(row[0]);
            let fContent = "";
            if (row[1] instanceof Uint8Array) {
              let bytes = row[1];
              if (cryptoKeys && bytes.length > 0 && bytes[0] !== 0x3c) {
                const decryptedBuffer = await crypto.subtle.decrypt(
                  { name: "AES-CBC", iv: cryptoKeys.iv as any },
                  cryptoKeys.key,
                  bytes as any
                );
                bytes = pako.inflate(new Uint8Array(decryptedBuffer));
              } else if (bytes.length > 0 && bytes[0] !== 0x3c) {
                try { bytes = pako.inflate(bytes); } catch(e){}
              }
              fContent = new TextDecoder().decode(bytes);
            } else {
              fContent = String(row[1]);
            }
            footnotes[fId] = fContent;
          }
        }
      } catch (e) {
        console.warn("No Footnote table found or error reading it:", e);
      }
    } finally {
      db.close();
    }

    // Process media and save to IndexedDB bucket
    const imageExtensions = ['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'];
    for (const fileName of Object.keys(allZipEntries)) {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      if (imageExtensions.includes(ext)) {
        await this.extractAndSaveMedia(allZipEntries, fileName);
      }
    }

    const processedPublication: JwpubPublication = {
      symbol,
      title,
      chapters,
      footnotes,
      lastAccessed: new Date().toISOString()
    };

    return processedPublication;
  },

  processContentHtml(html: string): { processedHtml: string, paragraphs: any[] } {
    if (typeof window === "undefined") return { processedHtml: html, paragraphs: [] };
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const paragraphs: any[] = [];
    let pidCounter = 0;

    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode() as Element | null;
    
    const tagsToTag = ['p', 'h1', 'h2', 'h3', 'h4', 'li', 'blockquote', 'caption', 'dt', 'dd'];

    while (node) {
      const tag = node.tagName.toLowerCase();
      
      // Normalize alignment classes for floating images
      const classList = Array.from(node.classList);
      const isEast = classList.some(c => c.includes('east') || c === 'right');
      const isWest = classList.some(c => c.includes('west') || c === 'left');
      
      if (isEast) node.classList.add('jw-align-right');
      if (isWest) node.classList.add('jw-align-left');

      if (tagsToTag.includes(tag)) {
        const pid = `p${pidCounter++}`;
        node.setAttribute('data-pid', pid);
        
        paragraphs.push({
          index: pidCounter - 1,
          type: tag as any,
          content: node.textContent?.trim() || "",
          html: node.innerHTML,
          images: [],
          references: []
        });
      }
      node = walker.nextNode() as Element | null;
    }

    return { processedHtml: doc.body.innerHTML, paragraphs };
  },

  async extractAndSaveMedia(zipEntries: Record<string, JSZip.JSZipObject>, fileName: string): Promise<string> {
    const entry = zipEntries[fileName];
    if (!entry) return "";

    const blob = await entry.async("blob");
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
    let mime = "image/jpeg";
    if (ext === "png") mime = "image/png";
    else if (ext === "svg") mime = "image/svg+xml";
    else if (ext === "webp") mime = "image/webp";

    const image: JwpubImage = {
      id: fileName,
      blob,
      mimeType: mime
    };

    await indexedDbService.saveImage(image);
    return fileName;
  }
};
