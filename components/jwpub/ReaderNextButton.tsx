"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReaderStore } from "@/store/readerStore";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { JwpubPublication } from "@/schemas/jwpubSchema";

interface ReaderNextButtonProps {
  pub: JwpubPublication;
}

export function ReaderNextButton({ pub }: ReaderNextButtonProps) {
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

  const handleNextChapter = useCallback(() => {
    const nextIdx = currentChapterIndex === 0 ? 2 : currentChapterIndex + 1;
    if (pub && nextIdx < pub.chapters.length) {
      updateChapterIndex(nextIdx);
    }
  }, [pub, currentChapterIndex, updateChapterIndex]);

  return (
    <div className="hidden lg:flex sticky top-0 h-screen items-center px-4 xl:px-8 z-40">
      <Button
        variant="secondary"
        size="icon"
        className="w-12 h-12 rounded-full shadow-lg opacity-40 hover:opacity-100 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-none transition-all focus:ring-0"
        onClick={handleNextChapter}
        disabled={currentChapterIndex >= (pub?.chapters.length || 0) - 1}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
}
