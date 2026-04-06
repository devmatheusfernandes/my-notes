"use client";

import { ReactNode } from "react";
import { SWRConfig } from "swr";

function localStorageProvider() {
  if (typeof window === "undefined") return new Map();

  // Restaurar o cache do localStorage na inicialização
  let cache;
  try {
    const savedCache = localStorage.getItem("app-cache");
    cache = new Map(JSON.parse(savedCache || "[]"));
  } catch (e) {
    console.error("Erro ao carregar cache do SWR:", e);
    cache = new Map();
  }

  // Antes do descarregamento da página, salvar o cache no localStorage
  const handleUnload = () => {
    try {
      const appCache = JSON.stringify(Array.from(cache.entries()));
      localStorage.setItem("app-cache", appCache);
    } catch (e) {
      console.error("Erro ao salvar cache do SWR:", e);
    }
  };

  window.addEventListener("beforeunload", handleUnload);
  // Também salvar em intervalos ou visibilidade para maior segurança
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      handleUnload();
    }
  });

  return cache;
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{ 
        provider: localStorageProvider,
        revalidateOnFocus: false, // Opcional: evita revalidações excessivas ao voltar para a aba offline
        revalidateIfStale: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
