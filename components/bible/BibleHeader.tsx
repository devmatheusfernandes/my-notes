"use client";
import { Search, Globe, ChevronLeft, X, PanelRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BibleHeaderProps {
  version: string;
  book: string;
  chapter: number;
  query: string;
  onQueryChange: (q: string) => void;
  onSearchSubmit: () => void;
  onBack?: () => void;
  onOpenTranslations: () => void;
  isSearchActive?: boolean;
  setIsSearchActive?: (active: boolean) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function BibleHeader({
  version,
  book,
  chapter,
  query,
  onQueryChange,
  onSearchSubmit,
  onBack,
  onOpenTranslations,
  isSearchActive: isSearching = false,
  setIsSearchActive: setIsSearching = () => { },
  isSidebarOpen = true,
  onToggleSidebar = () => { },
}: BibleHeaderProps) {
  const handleSearchToggle = () => {
    setIsSearching(!isSearching);
    if (!isSearching) setTimeout(() => document.getElementById("bible-search-input")?.focus(), 100);
  };

  return (
    <header className="sticky top-0 z-50 w-full h-16 border-b border-zinc-200 dark:border-zinc-800 bg-background/80 backdrop-blur-md px-4 flex items-center justify-between gap-4">
      <AnimatePresence mode="wait">
        {!isSearching ? (
          <motion.div
            key="header-content"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-primary uppercase tracking-widest leading-none">
                {version}
              </span>
              <h1 className="text-lg font-bold truncate leading-tight">
                {book || "Bíblia"} {chapter > 0 ? chapter : ""}
              </h1>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="search-input"
            initial={{ opacity: 0.5, width: "0%" }}
            animate={{ opacity: 1, width: "100%" }}
            exit={{ opacity: 0.5, width: "0%" }}
            className="flex items-center gap-2 flex-1 relative"
          >
            <Search className="absolute left-3 w-5 h-5 text-zinc-400" />
            <input
              id="bible-search-input"
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Pesquisar por texto ou Strongs (ex: G1)..."
              className="w-full h-10 pl-10 pr-10 bg-zinc-100 dark:bg-zinc-900 border-none rounded-full focus:ring-2 focus:ring-primary outline-none transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchSubmit();
              }}
            />
            <button
              onClick={handleSearchToggle}
              className="absolute right-3 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1">
        {!isSearching && (
          <>
            <button
              onClick={handleSearchToggle}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title="Pesquisar"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenTranslations}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors font-bold text-zinc-600 dark:text-zinc-400"
              title="Mudar tradução"
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleSidebar}
              className={cn(
                "p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors",
                isSidebarOpen ? "text-primary" : "text-zinc-400"
              )}
              title={isSidebarOpen ? "Fechar referências" : "Abrir referências"}
            >
              <PanelRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
