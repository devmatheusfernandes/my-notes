import React from "react";

/**
 * Hook client-only — requer contexto de Client Component (`'use client'`).
 *
 * Retorna `undefined` durante a renderização no servidor (SSR/SSG) e antes
 * da montagem no cliente, evitando hydration mismatch. Consumidores devem
 * tratar o estado `undefined` como "ainda não determinado" e renderizar
 * um estado neutro até o valor ser resolvido.
 *
 * Detecta se o app está rodando em modo standalone (PWA instalado).
 *
 * @example
 * const isStandalone = useIsStandalone();
 * if (isStandalone === undefined) return null; // aguarda montagem
 * return isStandalone ? <StandaloneUI /> : <BrowserUI />;
 */
export function useIsStandalone(): boolean | undefined {
  const [isStandalone, setIsStandalone] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const onChange = () => {
      setIsStandalone(standalone.matches);
    };
    standalone.addEventListener("change", onChange);
    setIsStandalone(standalone.matches);
    return () => standalone.removeEventListener("change", onChange);
  }, []);

  return isStandalone;
}
