"use client";

import { BookOpen } from "lucide-react";
import { JwpubPublication } from "@/schemas/jwpubSchema";
import { useReaderStore } from "@/store/readerStore";
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface ChapterDrawerProps {
  pub: JwpubPublication;
}

export function ChapterDrawer({ pub }: ChapterDrawerProps) {
  const router = useRouter();
  const currentChapterIndex = useReaderStore((s) => s.currentChapterIndex);
  const setCurrentChapterIndex = useReaderStore((s) => s.setCurrentChapterIndex);
  const setDirection = useReaderStore((s) => s.setDirection);

  const updateChapterIndex = useCallback((index: number) => {
    const newDir = index > currentChapterIndex ? 1 : -1;
    setDirection(newDir);
    setCurrentChapterIndex(index);
    router.push(`?c=${index}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentChapterIndex, router, setCurrentChapterIndex, setDirection]);

  return (
    <DrawerContent className="max-h-[85vh]">
      <div className="mx-auto w-full max-w-md flex flex-col h-full">
        <DrawerHeader className="border-b shrink-0">
          <DrawerTitle>Índice de Capítulos</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1 pb-10">
            {pub.chapters.slice(2).map((chapter, idx) => {
              const actualIdx = idx + 2;
              return (
                <DrawerClose key={chapter.id} asChild>
                  <button
                    onClick={() => updateChapterIndex(actualIdx)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                      currentChapterIndex === actualIdx
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border border-blue-100 dark:border-blue-800"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-xs opacity-50 w-6 tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="truncate text-sm">{chapter.title}</span>
                    {currentChapterIndex === actualIdx && (
                      <BookOpen className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                </DrawerClose>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </DrawerContent>
  );
}
