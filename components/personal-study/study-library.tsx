"use client";

import { useState, useMemo } from "react";
import { useJwpub } from "@/hooks/use-jwpub";
import { JwpubMetadata } from "@/schemas/jwpubSchema";
import {
  Plus,
  BookOpen,
  Trash2,
  ChevronRight,
  FileText,
  Loader2,
  SearchX
} from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
  DrawerClose
} from "@/components/ui/drawer";
import { JwpubUploader } from "@/components/jwpub/JwpubUploader";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loading } from "@/components/ui/loading";
import { HighlightedSnippet } from "../search/highlighted-snippet";
import { PublicationSearchMatch } from "@/hooks/use-unified-search";
import { publicacoes, CategoriaPublicacao } from "@/lib/jwpub/publication-list";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";

const CATEGORIES: CategoriaPublicacao[] = [
  'Bíblias', 'Obras de referência', 'Periódicos', 'Livros', 'Anuários',
  'Brochuras', 'Livretos', 'Folhetos', 'Programas', 'Séries de Artigos', 'Manuais e Orientações'
];

interface StudyLibraryProps {
  search: string;
  searchResults: (JwpubMetadata & { matches: PublicationSearchMatch[] })[];
  isSearching: boolean;
}

export function StudyLibrary({ search, searchResults, isSearching }: StudyLibraryProps) {
  const { publications: allPubs, isLoading: isLoadingAll, deletePublication } = useJwpub();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [pubToDelete, setPubToDelete] = useState<JwpubMetadata | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const hasSearch = search.trim().length > 0;
  const [visibleSearchCount, setVisibleSearchCount] = useState(9);

  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setVisibleSearchCount(9);
  }

  const flattenedMatches = useMemo(() => {
    if (!hasSearch) return [];
    return searchResults.flatMap(pub =>
      pub.matches.map(match => ({
        ...match,
        pubTitle: pub.title,
        pubSymbol: pub.symbol
      }))
    );
  }, [hasSearch, searchResults]);

  const filteredPubs = useMemo(() => {
    if (hasSearch || !allPubs) return [];
    if (selectedCategories.length === 0) return allPubs;

    return allPubs.filter(pub => {
      const info = publicacoes.find(p => p.codigo === pub.symbol);
      return info && selectedCategories.includes(info.categoria);
    });
  }, [allPubs, selectedCategories, hasSearch]);

  const displayPubs = hasSearch ? [] : filteredPubs;

  const handleDeleteClick = (pub: JwpubMetadata, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPubToDelete(pub);
    setIsDeleteDrawerOpen(true);
  };

  const confirmDelete = () => {
    if (pubToDelete) {
      deletePublication(pubToDelete.symbol);
      setIsDeleteDrawerOpen(false);
      setPubToDelete(null);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <motion.div
          variants={pageContainerVariants}
          initial="hidden"
          animate="visible"
          className="pb-20"
        >
          <div className="flex flex-col gap-8">
            <motion.div variants={itemFadeInUpVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="page-title leading-tight">Biblioteca</h2>
                  {isSearching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  <BookOpen className="w-3 h-3" />
                  {allPubs?.length || 0} publicações importadas localmente
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/40">
                  {hasSearch ? `${flattenedMatches.length} RESULTADOS` : `${allPubs?.length || 0} DISPONÍVEIS`}
                </div>
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button className="gap-2 shrink-0 bg-foreground rounded-full shadow-sm px-6 text-background transition-transform active:scale-95">
                      <Plus className="w-4 h-4" />
                      Importar JWPUB
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="mx-auto w-full max-w-lg p-6">
                      <DrawerHeader className="px-0 flex flex-col items-center text-center">
                        <DrawerTitle className="text-xl">Importar Publicação</DrawerTitle>
                        <DrawerDescription className="text-base pt-2">
                          Selecione um arquivo .jwpub para processar e salvar no seu navegador.
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="pt-4">
                        <JwpubUploader />
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </motion.div>

            {!hasSearch && (
              <motion.div variants={itemFadeInUpVariants}>
                <ScrollArea className="w-full mb-8">
                  <div className="flex gap-2 pb-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          if (selectedCategories.includes(cat)) {
                            setSelectedCategories(prev => prev.filter(k => k !== cat))
                          } else {
                            setSelectedCategories(prev => [...prev, cat])
                          }
                        }}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
                          selectedCategories.includes(cat)
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card text-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="invisible sm:visible" />
                </ScrollArea>
              </motion.div>
            )}
          </div>

          <div className="flex-1 lg:max-h-[calc(89vh-100px)] max-h-[calc(70vh-100px)] overflow-y-auto pr-2 mt-4">
            {isLoadingAll ? (
              <Loading />
            ) : hasSearch ? (
              flattenedMatches.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    {flattenedMatches.slice(0, visibleSearchCount).map((match, idx) => (
                      <motion.div key={`${match.pubSymbol}-${idx}`} variants={itemFadeInUpVariants}>
                        <Link
                          href={`/hub/personal-study/${match.pubSymbol}?h=${encodeURIComponent(search)}${match.chapterIndex !== undefined ? `&chapter=${match.chapterIndex}` : ""}`}
                          className="group block p-4 bg-card border border-border/40 rounded-sm hover:border-primary/40 hover:bg-accent/5 transition-all shadow-xs"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <BookOpen className="w-3 h-3 text-primary/60" />
                                <span className="truncate max-w-[200px]">{match.pubTitle}</span>
                                <span className="opacity-40">•</span>
                                <span className="font-mono bg-muted px-1 rounded">{match.pubSymbol}</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <HighlightedSnippet
                              text={match.text}
                              term={search}
                              symbol={match.pubSymbol}
                              chapterIndex={match.chapterIndex}
                              asDiv={true}
                            />
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {visibleSearchCount < flattenedMatches.length && (
                    <motion.div variants={itemFadeInUpVariants} className="flex justify-center pt-4 pb-8">
                      <Button
                        variant="ghost"
                        onClick={() => setVisibleSearchCount(prev => prev + 9)}
                        className="rounded-full px-8 h-10 font-bold gap-2 text-muted-foreground hover:text-foreground"
                      >
                        Carregar mais frases
                        <Plus className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div variants={itemFadeInUpVariants}>
                  <NoResults search={search} setIsDrawerOpen={setIsDrawerOpen} />
                </motion.div>
              )
            ) : displayPubs.length > 0 ? (
              <div
                className="border rounded-sm divide-y bg-card overflow-hidden shadow-xs"
              >
                {displayPubs.map((pub) => (
                  <motion.div
                    key={pub.symbol}
                    className="group flex flex-col p-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    variants={itemFadeInUpVariants}
                  >
                    <div className="flex items-center p-4">
                      <Link
                        href={`/hub/personal-study/${pub.symbol}`}
                        className="flex-1 flex items-center gap-4 overflow-hidden"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate text-foreground">{pub.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase text-[10px] font-bold">{pub.symbol}</span>
                            <span>•</span>
                            <span>Acessado {formatDistanceToNow(new Date(pub.lastAccessed), { addSuffix: true, locale: ptBR })}</span>
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={(e) => handleDeleteClick(pub, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div variants={itemFadeInUpVariants}>
                <NoResults search={search} setIsDrawerOpen={setIsDrawerOpen} />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <Drawer open={isDeleteDrawerOpen} onOpenChange={setIsDeleteDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg p-6">
            <DrawerHeader className="px-0 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <DrawerTitle className="text-xl">Remover publicação?</DrawerTitle>
              <DrawerDescription className="text-base pt-2 text-center">
                Tem certeza que deseja remover <strong>&quot;{pubToDelete?.title}&quot;</strong>?
                Esta ação não poderá ser desfeita e os dados locais serão excluídos.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-3 py-6">
              <Button
                variant="destructive"
                className="w-full h-12 text-base font-semibold rounded-xl"
                onClick={confirmDelete}
              >
                Sim, Remover
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="w-full h-12 text-base rounded-xl text-foreground"
                >
                  Cancelar
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function NoResults({ search, setIsDrawerOpen }: { search: string; setIsDrawerOpen: (o: boolean) => void }) {
  if (search) {
    return (
      <Empty className="py-12 border-none">
        <EmptyContent>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>Nenhum resultado encontrado</EmptyTitle>
          <EmptyDescription>
            Sua busca por &quot;{search}&quot; não retornou nenhuma publicação ou trecho correspondente.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Empty className="py-12 border-2 border-dashed bg-muted/20">
      <EmptyContent>
        <EmptyMedia variant="icon">
          <FileText />
        </EmptyMedia>
        <EmptyTitle>Sua biblioteca está vazia</EmptyTitle>
        <EmptyDescription>
          Importe um arquivo .jwpub para começar a organizar seu estudo pessoal.
        </EmptyDescription>
        <Button onClick={() => setIsDrawerOpen(true)} variant="outline" className="mt-2 text-foreground rounded-full">
          Importar agora
        </Button>
      </EmptyContent>
    </Empty>
  );
}
