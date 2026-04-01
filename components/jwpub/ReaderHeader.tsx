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
import { LayoutPanelTopIcon } from "@/components/ui/layout-panel-top";
import { cn } from "@/lib/utils";

interface ReaderHeaderProps {
  pub: JwpubPublication;
}

export function ReaderHeader({ pub }: ReaderHeaderProps) {
  const router = useRouter();
  const setIsChapterDrawerOpen = useReaderStore((s) => s.setIsChapterDrawerOpen);
  const isChapterDrawerOpen = useReaderStore((s) => s.isChapterDrawerOpen);
  const isSidebarOpen = useReaderStore((s) => s.isSidebarOpen);
  const setIsSidebarOpen = useReaderStore((s) => s.setIsSidebarOpen);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-5xl mx-auto gap-4">

        {/* Lado Esquerdo: Botão Voltar e Título */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full group hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/hub/personal-study")}
            aria-label="Voltar para estudos"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          </Button>

          <div className="flex flex-col min-w-0 justify-center">
            <span className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider truncate mb-0.5">
              {pub.symbol}
            </span>
            <h2 className="text-sm md:text-base font-medium text-foreground truncate leading-none">
              {pub.title}
            </h2>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Drawer open={isChapterDrawerOpen} onOpenChange={setIsChapterDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 rounded-full sm:px-4"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline-block font-medium">Capítulos</span>
              </Button>
            </DrawerTrigger>
            <ChapterDrawer pub={pub} />
          </Drawer>

          {/* Divisor sutil no desktop */}
          <div className="w-px h-5 bg-border/60 mx-1 hidden sm:block" />

          <Button
            variant={isSidebarOpen ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "rounded-full transition-all duration-200",
              isSidebarOpen
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Alternar barra lateral"
            title="Painel lateral"
          >
            <LayoutPanelTopIcon size={18} className="rotate-90" />
          </Button>
        </div>

      </div>
    </header>
  );
}