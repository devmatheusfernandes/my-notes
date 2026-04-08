"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: () => {
          // Initialize cache from localStorage
          if (typeof window === "undefined") return new Map();
          
          const cache = new Map(
            JSON.parse(localStorage.getItem("app-swr-cache") || "[]")
          );

          // Save cache to localStorage before unload
          window.addEventListener("beforeunload", () => {
             // We only persist select keys to avoid localStorage limits
             // specifically "notes" and "jwpub" related data
             const entriesToPersist = Array.from(cache.entries()).filter(([key]) => {
                if (typeof key !== 'string') return false;
                return key.includes('notes') || key.includes('jwpub') || key.includes('symbols');
             });
             
             try {
               localStorage.setItem("app-swr-cache", JSON.stringify(entriesToPersist));
             } catch (e) {
               console.warn("SWR Cache persistence failed:", e);
             }
          });

          return cache;
        },
        // Revalidate on reconnect to ensure fresh data once online
        revalidateOnReconnect: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
