"use client";

import React, { useState, useEffect } from "react";
import { Info, ExternalLink, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import type { StrongResult } from "@/schemas/strong";

interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleSearchResultsProps {
  query: string;
  version: string;
  onSelectVerse: (book: string, chapter: number, verse: number) => void;
}

export function BibleSearchResults({
  query,
  version,
  onSelectVerse,
}: BibleSearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [strongResults, setStrongResults] = useState<StrongResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setStrongResults([]);
      return;
    }

    const handleSearch = async () => {
      setLoading(true);
      try {
        // 1. Strong lookup
        const strongMatch = query.match(/^[GH]\d+$/i);
        if (strongMatch || query.length >= 3) {
          const strongRes = await fetch(`/api/strong?q=${query}`);
          if (strongRes.ok) {
            const data = await strongRes.json();
            setStrongResults(data.results || []);
          }
        } else {
          setStrongResults([]);
        }

        // 2. Bible text search
        const bibleRes = await fetch(`/api/bible/search?v=${version}&q=${encodeURIComponent(query)}`);
        if (bibleRes.ok) {
          const data = await bibleRes.json();
          setResults(data.results || []);
        }
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setLoading(false);
      }
    };

    handleSearch();
  }, [query, version]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="max-w-5xl mx-auto p-6 space-y-12">
        <header className="flex flex-col gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Resultados para <span className="text-primary">&quot;{query}&quot;</span>
          </h2>
          <p className="text-zinc-500">
            {loading ? "Pesquisando..." : `Encontrados ${results.length} versículos e ${strongResults.length} definições.`}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results Column */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-3 h-3" />
              Ocorrências no Texto
            </h3>

            <div className="space-y-4">
              {results.map((r, i) => (
                <motion.button
                  key={`${r.book}-${r.chapter}-${r.verse}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectVerse(r.book, r.chapter, r.verse)}
                  className="w-full text-left p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg text-primary">
                      {r.book} {r.chapter}:{r.verse}
                    </span>
                    <ExternalLink className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {r.text}
                  </p>
                </motion.button>
              ))}

              {!loading && results.length === 0 && (
                <div className="p-12 text-center bg-zinc-100 dark:bg-zinc-900 rounded-3xl text-zinc-500">
                  Nenhuma ocorrência encontrada para esta busca no texto.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Strong Definitions Column */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-3 h-3" />
              Dicionário Strongs
            </h3>

            <div className="space-y-4">
              {strongResults.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {s.id}
                    </span>
                    <span className="text-2xl font-serif italic text-zinc-900 dark:text-zinc-100">
                      {s.lemma}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mb-4 font-medium uppercase tracking-wider">
                    {s.transliteration} • {s.pronunciation}
                  </div>
                  <div className="text-sm dark:text-zinc-200 leading-relaxed prose prose-sm dark:prose-invert">
                    {s.definition}
                  </div>
                  {s.usage && (
                    <div className="mt-4 pt-4 border-t border-primary/10 text-xs text-zinc-500 italic leading-relaxed">
                      <strong>Uso:</strong> {s.usage}
                    </div>
                  )}
                </motion.div>
              ))}

              {!loading && strongResults.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 text-sm">
                  Nenhuma definição Strong encontrada.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
