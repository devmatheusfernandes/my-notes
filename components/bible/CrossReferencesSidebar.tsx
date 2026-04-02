"use client";

import React, { useEffect, useState } from "react";
import { Link2, BookOpen, Layers, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TargetReference } from "@/data/scheme/cross-reference";

interface CrossReferencesSidebarProps {
  book: string;
  chapter: number;
  verse?: number | null;
  version: string;
  onNavigate: (book: string, chapter: number, verse: number) => void;
}

function ReferenceItem({ 
  ref, 
  version, 
  onNavigate 
}: { 
  ref: TargetReference; 
  version: string; 
  onNavigate: (book: string, chapter: number, verse: number) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && !text && !loading) {
      setLoading(true);
      try {
        const res = await fetch(`/api/bible?v=${version}&b=${encodeURIComponent(ref.book)}&c=${ref.chapter}`);
        if (res.ok) {
          const data = await res.json();
          const verseMatch = data.verses.find((v: { verse: number; text: string }) => v.verse === ref.verse);
          setText(verseMatch ? verseMatch.text : "Versículo não encontrado nesta tradução.");
        }
      } catch (e) {
        console.error("Failed to fetch reference text:", e);
        setText("Falha ao carregar o texto.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            isOpen ? "bg-primary/20 text-primary" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-600"
          )}>
            <Link2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm">
            {ref.book} {ref.chapter}:{ref.verse}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            <div className="pt-2 pb-4 border-t border-zinc-100 dark:border-zinc-800">
              {loading ? (
                <div className="py-4 flex justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                  &quot;{text}&quot;
                </p>
              )}
            </div>
            
            <button
              onClick={() => onNavigate(ref.book, ref.chapter, ref.verse)}
              className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-500 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              Ver capítulo 
              <ExternalLink className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CrossReferencesSidebar({
  book,
  chapter,
  verse,
  version,
  onNavigate,
}: CrossReferencesSidebarProps) {
  const [references, setReferences] = useState<TargetReference[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!book || !chapter || !verse) return;
    
    const fetchRefs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cross-reference?book=${encodeURIComponent(book)}&chapter=${chapter}`);
        if (res.ok) {
          const data = await res.json();
          const allRefs = data.references || {};
          setReferences(allRefs[verse] || []);
        }
      } catch (e) {
        console.error("Failed to fetch cross references:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRefs();
  }, [book, chapter, verse]);

  if (!verse) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center gap-4">
        <BookOpen className="w-12 h-12 opacity-20" />
        <p className="text-sm">Selecione um versículo para ver as referências cruzadas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-none mb-1">
            Referências
          </h2>
          <p className="text-xs text-zinc-500 font-medium">
            {book} {chapter}:{verse}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : references.length > 0 ? (
          references.map((ref, i) => (
            <ReferenceItem 
              key={`${ref.book}-${ref.chapter}-${ref.verse}-${i}`}
              ref={ref}
              version={version}
              onNavigate={onNavigate}
            />
          ))
        ) : (
          <p className="text-sm text-zinc-500 text-center py-12">
            Nenhuma referência encontrada para este versículo.
          </p>
        )}
      </div>
    </div>
  );
}
