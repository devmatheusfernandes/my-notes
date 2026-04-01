"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JwpubPublication } from "@/schemas/jwpubSchema";
import { useReaderStore } from "@/store/readerStore";
import {
  Drawer,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ChapterDrawer } from "./ChapterDrawer";

interface ReaderHeaderProps {
  pub: JwpubPublication;
}

export function ReaderHeader({ pub }: ReaderHeaderProps) {
  const router = useRouter();
  const setIsDrawerOpen = useReaderStore((s) => s.setIsChapterDrawerOpen);
  const isOpen = useReaderStore((s) => s.isChapterDrawerOpen);

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/hub/personal-study")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest truncate">
              {pub.symbol}
            </span>
            <h2 className="text-sm font-semibold truncate leading-none">
              {pub.title}
            </h2>
          </div>
        </div>

        <Drawer open={isOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Capítulos</span>
            </Button>
          </DrawerTrigger>
          <ChapterDrawer pub={pub} />
        </Drawer>
      </div>
    </header>
  );
}
