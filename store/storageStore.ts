import { create } from "zustand";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StorageUsageData {
  totalBytesUsed: number;
  uploadCount: number;
  lastUploadAt: Date | null;
}

interface StorageState {
  usage: StorageUsageData;
  isLoading: boolean;
  limitBytes: number;
  isLimitReached: boolean;
  availableBytes: number;
  subscribeToUsage: (userId: string) => () => void;
}

const STORAGE_LIMIT_MB = 200;
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_MB * 1024 * 1024;

export const useStorageStore = create<StorageState>((set) => ({
  usage: {
    totalBytesUsed: 0,
    uploadCount: 0,
    lastUploadAt: null,
  },
  isLoading: true,
  limitBytes: STORAGE_LIMIT_BYTES,
  isLimitReached: false,
  availableBytes: STORAGE_LIMIT_BYTES,

  subscribeToUsage: (userId: string) => {
    set({ isLoading: true });

    const usageRef = doc(db, "usage", userId);
    
    // Realtime listener for quota
    const unsubscribe = onSnapshot(usageRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const totalBytesUsed = data.totalBytesUsed || 0;
        
        set({
          usage: {
            totalBytesUsed,
            uploadCount: data.uploadCount || 0,
            lastUploadAt: data.lastUploadAt ? data.lastUploadAt.toDate() : null,
          },
          isLimitReached: totalBytesUsed >= STORAGE_LIMIT_BYTES,
          availableBytes: Math.max(0, STORAGE_LIMIT_BYTES - totalBytesUsed),
          isLoading: false,
        });
      } else {
        // Se ainda não tiver documento (upload zerado), consideramos uso = 0.
        set({
          usage: {
            totalBytesUsed: 0,
            uploadCount: 0,
            lastUploadAt: null,
          },
          isLimitReached: false,
          availableBytes: STORAGE_LIMIT_BYTES,
          isLoading: false,
        });
      }
    }, (error) => {
      console.error("Error listening to user storage quota: ", error);
      set({ isLoading: false });
    });

    return unsubscribe;
  }
}));
