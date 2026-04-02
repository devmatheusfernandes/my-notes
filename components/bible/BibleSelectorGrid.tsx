"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BibleBook {
  name: string;
  short: string;
  chapters: number;
}

const OT_BOOKS: BibleBook[] = [
  { name: "Gênesis", short: "Ge", chapters: 50 },
  { name: "Êxodo", short: "Ex", chapters: 40 },
  { name: "Levítico", short: "Le", chapters: 27 },
  { name: "Números", short: "Nu", chapters: 36 },
  { name: "Deuteronômio", short: "De", chapters: 34 },
  { name: "Josué", short: "Jos", chapters: 24 },
  { name: "Juízes", short: "Jg", chapters: 21 },
  { name: "Rute", short: "Ru", chapters: 4 },
  { name: "1 Samuel", short: "1Sa", chapters: 31 },
  { name: "2 Samuel", short: "2Sa", chapters: 24 },
  { name: "1 Reis", short: "1Ki", chapters: 22 },
  { name: "2 Reis", short: "2Ki", chapters: 25 },
  { name: "1 Crônicas", short: "1Ch", chapters: 29 },
  { name: "2 Crônicas", short: "2Ch", chapters: 36 },
  { name: "Esdras", short: "Ezr", chapters: 10 },
  { name: "Neemias", short: "Ne", chapters: 13 },
  { name: "Ester", short: "Es", chapters: 10 },
  { name: "Jó", short: "Job", chapters: 42 },
  { name: "Salmos", short: "Ps", chapters: 150 },
  { name: "Provérbios", short: "Pr", chapters: 31 },
  { name: "Eclesiastes", short: "Ec", chapters: 12 },
  { name: "Cântico de Salomão", short: "Ca", chapters: 8 },
  { name: "Isaías", short: "Isa", chapters: 66 },
  { name: "Jeremias", short: "Jer", chapters: 52 },
  { name: "Lamentações", short: "La", chapters: 5 },
  { name: "Ezequiel", short: "Eze", chapters: 48 },
  { name: "Daniel", short: "Da", chapters: 12 },
  { name: "Oseias", short: "Ho", chapters: 14 },
  { name: "Joel", short: "Joe", chapters: 3 },
  { name: "Amós", short: "Am", chapters: 9 },
  { name: "Obadias", short: "Ob", chapters: 1 },
  { name: "Jonas", short: "Jon", chapters: 4 },
  { name: "Miqueias", short: "Mic", chapters: 7 },
  { name: "Naum", short: "Na", chapters: 3 },
  { name: "Habacuque", short: "Hab", chapters: 3 },
  { name: "Sofonias", short: "Zep", chapters: 3 },
  { name: "Ageu", short: "Hag", chapters: 2 },
  { name: "Zacarias", short: "Zec", chapters: 14 },
  { name: "Malaquias", short: "Mal", chapters: 4 },
];

const NT_BOOKS: BibleBook[] = [
  { name: "Mateus", short: "Mt", chapters: 28 },
  { name: "Marcos", short: "Mr", chapters: 16 },
  { name: "Lucas", short: "Lu", chapters: 24 },
  { name: "João", short: "Joh", chapters: 21 },
  { name: "Atos", short: "Ac", chapters: 28 },
  { name: "Romanos", short: "Ro", chapters: 16 },
  { name: "1 Coríntios", short: "1Co", chapters: 16 },
  { name: "2 Coríntios", short: "2Co", chapters: 13 },
  { name: "Gálatas", short: "Ga", chapters: 6 },
  { name: "Efésios", short: "Eph", chapters: 6 },
  { name: "Filipenses", short: "Php", chapters: 4 },
  { name: "Colossenses", short: "Col", chapters: 4 },
  { name: "1 Tessalonicenses", short: "1Th", chapters: 5 },
  { name: "2 Tessalonicenses", short: "2Th", chapters: 3 },
  { name: "1 Timóteo", short: "1Ti", chapters: 6 },
  { name: "2 Timóteo", short: "2Ti", chapters: 4 },
  { name: "Tito", short: "Tit", chapters: 3 },
  { name: "Filemom", short: "Phm", chapters: 1 },
  { name: "Hebreus", short: "Heb", chapters: 13 },
  { name: "Tiago", short: "Jas", chapters: 5 },
  { name: "1 Pedro", short: "1Pe", chapters: 5 },
  { name: "2 Pedro", short: "2Pe", chapters: 3 },
  { name: "1 João", short: "1Jo", chapters: 5 },
  { name: "2 João", short: "2Jo", chapters: 1 },
  { name: "3 João", short: "3Jo", chapters: 1 },
  { name: "Judas", short: "Jud", chapters: 1 },
  { name: "Apocalipse", short: "Re", chapters: 22 },
];

const getShade = (index: number, isNT: boolean) => {
  if (!isNT) {
    if (index < 5) return "bg-[#5a5369] text-white"; // Ge-De (Lightest shade per description)
    if (index < 17) return "bg-[#443e4d] text-white"; // Jos-Est (Darker)
    if (index < 22) return "bg-[#332e3a] text-white"; // Jó-Ct (Darker than previous)
    return "bg-[#1f1b24] text-white"; // Is-Ml (Even darker)
  } else {
    if (index < 4) return "bg-[#1f1b24] text-white"; // Mt-Jo (Dark shade)
    if (index === 4) return "bg-[#726a83] text-white"; // At (Lighter shade)
    if (index < 26) return "bg-[#5a5369] text-white"; // Rm-Jud (Lighter more shade? assuming user meant lighter than gospels)
    return "bg-[#1f1b24] text-white"; // Ap (Dark shade again)
  }
};

interface BibleSelectorGridProps {
  onSelectBook: (book: BibleBook) => void;
  onSelectChapter: (book: BibleBook, chapter: number) => void;
  selectedBook: BibleBook | null;
}

export function BibleSelectorGrid({
  onSelectBook,
  onSelectChapter,
  selectedBook: propSelectedBook,
}: BibleSelectorGridProps) {
  // If we only have a book name (e.g. from URL), find the full book metadata
  const selectedBook = propSelectedBook && !propSelectedBook.chapters 
    ? [...OT_BOOKS, ...NT_BOOKS].find((b: { name: string }) => b.name === propSelectedBook.name) || null
    : propSelectedBook;

  if (selectedBook) {
    return (
      <div className="flex flex-col gap-6 p-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectBook(null as any)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold uppercase tracking-tight">
            {selectedBook.name}
          </h2>
        </div>
        
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
            <button
              key={chapter}
              onClick={() => onSelectChapter(selectedBook, chapter)}
              className="aspect-square flex items-center justify-center text-lg font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors rounded-md"
            >
              {chapter}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 p-4 select-none">
      <section>
        <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-zinc-500">
          Hebrew-Aramaic Scriptures
        </h2>
        <div className="grid grid-cols-6 gap-1">
          {OT_BOOKS.map((book, i) => (
            <button
              key={book.name}
              onClick={() => onSelectBook(book)}
              className={cn(
                "aspect-[4/3] flex items-center justify-center text-sm font-bold uppercase transition-all hover:scale-105 active:scale-95 border-[0.5px] border-zinc-500/20",
                getShade(i, false)
              )}
            >
              {book.short}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-zinc-500">
          Christian Greek Scriptures
        </h2>
        <div className="grid grid-cols-6 gap-1">
          {NT_BOOKS.map((book, i) => (
            <button
              key={book.name}
              onClick={() => onSelectBook(book)}
              className={cn(
                "aspect-[4/3] flex items-center justify-center text-sm font-bold uppercase transition-all hover:scale-105 active:scale-95 border-[0.5px] border-zinc-500/20",
                getShade(i, true)
              )}
            >
              {book.short}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
