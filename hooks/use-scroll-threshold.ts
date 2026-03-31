"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the window has been scrolled past a certain threshold.
 * 
 * @param threshold The number of pixels to scroll before the state changes to true.
 * @returns boolean indicating if the threshold has been passed.
 */
export function useScrollThreshold(threshold: number = 25): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isScrolled;
}
