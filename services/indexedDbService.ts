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
      const request = store.getAll();

      request.onsuccess = () => {
        const pubs = request.result as JwpubPublication[];
        const metadata = pubs.map(p => ({
          symbol: p.symbol,
          title: p.title,
          lastAccessed: p.lastAccessed
        }));
        resolve(metadata);
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

  async deletePublication(symbol: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PUBS, "readwrite");
      const store = transaction.objectStore(STORE_PUBS);
      const request = store.delete(symbol);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
