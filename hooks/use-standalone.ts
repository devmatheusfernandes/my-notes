import React from "react";

export function useIsStandalone() {
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
