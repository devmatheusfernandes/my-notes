import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook client-only — requer contexto de Client Component (`'use client'`).
 *
 * Retorna `undefined` durante a renderização no servidor (SSR/SSG) e antes
 * da montagem no cliente, evitando hydration mismatch. Consumidores devem
 * tratar o estado `undefined` como "ainda não determinado" e renderizar
 * um estado neutro (ex: retornar `null` ou um skeleton).
 *
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile === undefined) return null; // aguarda montagem
 * return isMobile ? <MobileView /> : <DesktopView />;
 */
export function useIsMobile(): boolean | undefined {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
