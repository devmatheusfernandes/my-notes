"use client";

import React from "react";
import { BIBLE_NAMES } from "@/data/constants/bible-books";
import { motion } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibleTranslationDrawerProps {
  currentVersion: string;
  onSelect: (version: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function BibleTranslationDrawer({
  currentVersion,
  onSelect,
  isOpen,
  onClose,
}: BibleTranslationDrawerProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="ml-auto w-full max-w-sm bg-background rounded-l-2xl shadow-2xl flex flex-col overflow-hidden h-full"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Traduções da Bíblia
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          {Object.entries(BIBLE_NAMES).map(([code, name]) => (
            <button
              key={code}
              onClick={() => {
                onSelect(code);
                onClose();
              }}
              className={cn(
                "w-full text-left p-4 rounded-xl flex items-center justify-between transition-all group",
                currentVersion === code 
                  ? "bg-primary/10 text-primary font-bold" 
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
              )}
            >
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest opacity-60">
                  {code}
                </span>
                <span className="text-sm truncate max-w-[200px]">
                  {name}
                </span>
              </div>
              {currentVersion === code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
