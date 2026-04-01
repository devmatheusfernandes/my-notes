"use client";

import { ChevronLeft as ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReaderStore } from "@/store/readerStore";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function ReaderPrevButton() {
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

  const handlePrevChapter = useCallback(() => {
    const prevIdx = currentChapterIndex === 2 ? 0 : currentChapterIndex - 1;
    if (prevIdx >= 0) {
      updateChapterIndex(prevIdx);
    }
  }, [currentChapterIndex, updateChapterIndex]);

  return (
    <div className="hidden lg:flex sticky top-0 h-screen items-center px-4 xl:px-8 z-40">
      <Button
        variant="secondary"
        size="icon"
        className="w-12 h-12 rounded-full shadow-lg opacity-40 hover:opacity-100 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-none transition-all focus:ring-0"
        onClick={handlePrevChapter}
        disabled={currentChapterIndex === 0}
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </Button>
    </div>
  );
}
