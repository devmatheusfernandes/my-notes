import { JwpubPublication, JwpubImage, JwpubMetadata } from "@/schemas/jwpubSchema";

const DB_NAME = "MyNotesJwpubDB";
const DB_VERSION = 1;
const STORE_PUBS = "publications";
const STORE_IMAGES = "images";

export const indexedDbService = {
  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_PUBS)) {
          db.createObjectStore(STORE_PUBS, { keyPath: "symbol" });
        }
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async savePublication(pub: JwpubPublication): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PUBS, "readwrite");
      const store = transaction.objectStore(STORE_PUBS);
      const request = store.put({
        ...pub,
        lastAccessed: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getPublication(symbol: string): Promise<JwpubPublication | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PUBS, "readonly");
      const store = transaction.objectStore(STORE_PUBS);
      const request = store.get(symbol);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async listPublications(): Promise<string[]> {
     const db = await this.openDB();
     return new Promise((resolve, reject) => {
       const transaction = db.transaction(STORE_PUBS, "readonly");
       const store = transaction.objectStore(STORE_PUBS);
       const request = store.getAllKeys();

       request.onsuccess = () => resolve(request.result as string[]);
       request.onerror = () => reject(request.error);
     });
  },

  async getPublicationsMetadata(): Promise<JwpubMetadata[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PUBS, "readonly");
      const store = transaction.objectStore(STORE_PUBS);
      const request = store.openCursor();
      const metadata: JwpubMetadata[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const p = cursor.value as JwpubPublication;
          metadata.push({
            symbol: p.symbol,
            title: p.title,
            lastAccessed: p.lastAccessed,
            tokens: p.tokens
          });
          cursor.continue();
        } else {
          resolve(metadata);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  async saveImage(image: JwpubImage): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_IMAGES, "readwrite");
      const store = transaction.objectStore(STORE_IMAGES);
      const request = store.put(image);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getImage(id: string): Promise<JwpubImage | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_IMAGES, "readonly");
      const store = transaction.objectStore(STORE_IMAGES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteImages(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_IMAGES, "readwrite");
      const store = transaction.objectStore(STORE_IMAGES);
      
      let completed = 0;
      let hasError = false;

      ids.forEach(id => {
        const request = store.delete(id);
        request.onsuccess = () => {
          completed++;
          if (completed === ids.length) resolve();
        };
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      });
    });
  },

  async deletePublication(symbol: string): Promise<void> {
    const pub = await this.getPublication(symbol);
    if (pub) {
      // Find all image IDs in all paragraphs of all chapters
      const imageIds = new Set<string>();
      pub.chapters.forEach(ch => {
        ch.paragraphs.forEach(p => {
          p.images.forEach(imgId => imageIds.add(imgId));
        });
      });
      
      if (imageIds.size > 0) {
        await this.deleteImages(Array.from(imageIds));
      }
    }

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PUBS, "readwrite");
      const store = transaction.objectStore(STORE_PUBS);
      const request = store.delete(symbol);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getStorageUsage(): Promise<{ totalBytes: number; pubCount: number }> {
    const db = await this.openDB();
    
    const calculatePubsSize = (): Promise<{ size: number; count: number }> => {
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_PUBS, "readonly");
        const store = transaction.objectStore(STORE_PUBS);
        const request = store.getAll();
        request.onsuccess = () => {
          const pubs = request.result as JwpubPublication[];
          const size = pubs.reduce((acc, p) => acc + JSON.stringify(p).length, 0);
          resolve({ size, count: pubs.length });
        };
      });
    };

    const calculateImagesSize = (): Promise<number> => {
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_IMAGES, "readonly");
        const store = transaction.objectStore(STORE_IMAGES);
        const request = store.getAll();
        request.onsuccess = () => {
          const images = request.result as JwpubImage[];
          const size = images.reduce((acc, img) => acc + img.blob.size, 0);
          resolve(size);
        };
      });
    };

    const [pubs, imagesSize] = await Promise.all([
      calculatePubsSize(),
      calculateImagesSize()
    ]);

    return {
      totalBytes: pubs.size + imagesSize,
      pubCount: pubs.count
    };
  }
};
