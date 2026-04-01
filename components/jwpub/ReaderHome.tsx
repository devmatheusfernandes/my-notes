"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import { JwpubPublication } from "@/schemas/jwpubSchema";

interface ReaderHomeProps {
  pub: JwpubPublication;
  onSelectChapter: (index: number) => void;
}

export function ReaderHome({ pub, onSelectChapter }: ReaderHomeProps) {
  return (
    <div className="py-12">
      <div className="mb-10 text-center sm:text-left">
        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-2 block">
          Início
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
          {pub.title}
        </h1>
        <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
          <BookOpen className="w-4 h-4" />
          <span>{pub.chapters.length - 2} Artigos disponíveis</span>
        </div>
      </div>

      <div className="grid gap-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">
          Índice de Artigos
        </h3>
        {pub.chapters.slice(2).map((chapter, idx) => {
          const actualIdx = idx + 2;
          return (
            <button
              key={chapter.id}
              onClick={() => onSelectChapter(actualIdx)}
              className="w-full text-left p-5 rounded-2xl transition-all flex items-center gap-5 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl hover:shadow-blue-500/5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors tabular-nums">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors truncate">
                  {chapter.title}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium opacity-0 group-hover:opacity-100 transition-all">
                  Ler agora
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
