"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { itemFadeInUpVariants } from "@/lib/animations";

interface Verse {
  verse: number;
  text: string;
}

interface BibleReaderProps {
  verses: Verse[];
  highlightedVerse?: number | null;
  onVerseClick: (verse: number) => void;
  isLoading?: boolean;
}

export function BibleReader({
  verses,
  highlightedVerse,
  onVerseClick,
  isLoading,
}: BibleReaderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedVerse && scrollRef.current) {
      const element = document.getElementById(`v-${highlightedVerse}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightedVerse, verses]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-400">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="animate-pulse">Carregando Escrituras...</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 leading-relaxed text-lg lg:text-xl">
      <AnimatePresence mode="popLayout">
        <motion.div
          key="verses-container"
          variants={itemFadeInUpVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="max-w-3xl mx-auto space-y-4"
        >
          {verses.map((v) => (
            <span
              key={v.verse}
              id={`v-${v.verse}`}
              onClick={() => onVerseClick(v.verse)}
              className={cn(
                "inline group cursor-pointer transition-all duration-300 rounded px-1 -mx-1",
                highlightedVerse === v.verse 
                  ? "bg-yellow-200/50 dark:bg-yellow-900/30 ring-1 ring-yellow-400/50" 
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <sup className="text-sm font-bold text-primary mr-1 select-none">
                {v.verse}
              </sup>
              <span className="text-zinc-800 dark:text-zinc-200">
                {v.text}
              </span>
              {" "}
            </span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
