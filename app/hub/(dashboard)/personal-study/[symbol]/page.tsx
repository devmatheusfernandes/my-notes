"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useJwpub } from "@/hooks/use-jwpub";
import { JwpubPublication } from "@/types/jwpub";
import { indexedDbService } from "@/services/indexedDbService";
import {
  ChevronLeft,
  Menu,
  BookOpen,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loading } from "@/components/ui/loading";

export default function JwpubReaderPage() {
  const { symbol } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPublication } = useJwpub();

  const [pub, setPub] = useState<JwpubPublication | null>(null);
  const [loading, setLoading] = useState(true);

  const initialChapter = parseInt(searchParams.get("c") || "1", 10);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(initialChapter);
  const [images, setImages] = useState<Record<string, string>>({});
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState(false);
  const [activeReference, setActiveReference] = useState<{ label: string; url: string } | null>(null);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    getPublication(symbol as string).then(data => {
      setPub(data);

      const c = parseInt(searchParams.get("c") || "", 10);
      if (isNaN(c) || c < 0 || (data && c >= data.chapters.length)) {
        const defaultChapter = data && data.chapters.length > 1 ? 1 : 0;
        setCurrentChapterIndex(defaultChapter);
        router.replace(`?c=${defaultChapter}`);
      } else {
        setCurrentChapterIndex(c);
      }

      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [symbol, getPublication, router, searchParams]);

  const updateChapterIndex = useCallback((index: number) => {
    const newDir = index > currentChapterIndex ? 1 : -1;
    setDirection(newDir);
    setCurrentChapterIndex(index);
    router.push(`?c=${index}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentChapterIndex, router]);

  const currentChapter = pub?.chapters[currentChapterIndex];

  useEffect(() => {
    if (!currentChapter) return;

    const loadImages = async () => {
      const newImages: Record<string, string> = { ...images };

      const imageIds = new Set<string>();
      const mediaMatches = currentChapter.html.matchAll(/jwpub-media:\/\/([^\s"'<>]+)/g);
      for (const match of mediaMatches) {
        imageIds.add(match[1]);
      }

      const srcMatches = currentChapter.html.matchAll(/src=["']([^"'<>]+?\.(?:jpg|png|svg|webp|gif))["']/g);
      for (const match of srcMatches) {
        if (!match[1].startsWith('data:') && !match[1].startsWith('blob:')) {
          imageIds.add(match[1].split('/').pop()!);
        }
      }

      for (const id of Array.from(imageIds)) {
        if (!newImages[id]) {
          const imgData = await indexedDbService.getImage(id);
          if (imgData) {
            newImages[id] = URL.createObjectURL(imgData.blob);
          }
        }
      }
      setImages(newImages);
    };

    loadImages();
  }, [currentChapter]);

  const handleNextChapter = useCallback(() => {
    if (pub && currentChapterIndex < pub.chapters.length - 1) {
      updateChapterIndex(currentChapterIndex + 1);
    }
  }, [pub, currentChapterIndex, updateChapterIndex]);

  const handlePrevChapter = useCallback(() => {
    if (currentChapterIndex > 0) {
      updateChapterIndex(currentChapterIndex - 1);
    }
  }, [currentChapterIndex, updateChapterIndex]);

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!pub) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold">Publicação não encontrada</h2>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Ocorreu um erro ao carregar o arquivo ou ele foi removido da sua biblioteca local.
        </p>
        <Button onClick={() => router.push("/hub/personal-study")}>Voltar para Biblioteca</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/hub/personal-study")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest truncate">{pub.symbol}</span>
              <h2 className="text-sm font-semibold truncate leading-none">{pub.title}</h2>
            </div>
          </div>

          <Drawer open={isChapterDrawerOpen} onOpenChange={setIsChapterDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">Capítulos</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <div className="mx-auto w-full max-w-md flex flex-col h-full">
                <DrawerHeader className="border-b shrink-0">
                  <DrawerTitle>Índice de Capítulos</DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-1 pb-10">
                    {pub.chapters.map((chapter, idx) => (
                      <DrawerClose key={chapter.id} asChild>
                        <button
                          onClick={() => updateChapterIndex(idx)}
                          className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${currentChapterIndex === idx
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border border-blue-100 dark:border-blue-800"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                        >
                          <span className="text-xs opacity-50 w-6 tabular-nums">{idx + 1}</span>
                          <span className="truncate">{chapter.title}</span>
                          {currentChapterIndex === idx && <BookOpen className="w-4 h-4 ml-auto" />}
                        </button>
                      </DrawerClose>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </header>

      <div className="flex-1 flex w-full max-w-5xl mx-auto relative min-h-screen shadow-sm">
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

        <main className="flex-1 min-w-0 relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentChapterIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 250 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -250 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) handlePrevChapter();
                else if (info.offset.x < -100) handleNextChapter();
              }}
              className="w-full max-w-2xl mx-auto"
            >
              {currentChapter && (
                <article>
                  <ChapterRenderer
                    html={currentChapter.html}
                    images={images}
                    footnotes={pub.footnotes || {}}
                    onReferenceClick={(ref) => setActiveReference(ref)}
                  />
                </article>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <div className="hidden lg:flex sticky top-0 h-screen items-center px-4 xl:px-8 z-40">
          <Button
            variant="secondary"
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg opacity-40 hover:opacity-100 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-none transition-all focus:ring-0"
            onClick={handleNextChapter}
            disabled={currentChapterIndex === pub.chapters.length - 1}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <Drawer open={!!activeReference} onOpenChange={(open) => !open && setActiveReference(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg p-6">
            <DrawerHeader>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <DrawerTitle className="text-xl">{activeReference?.label}</DrawerTitle>
            </DrawerHeader>
            <div className="py-4">
              {activeReference?.url.startsWith('jwpub://b/') ? (
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl my-4">
                  <p className="text-sm">O conteúdo da referência Bíblica <strong>{activeReference?.label}</strong> será exibido aqui em uma atualização futura.</p>
                </div>
              ) : (
                <div
                  className="jwpub-content text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: activeReference?.url || "" }}
                />
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function ChapterRenderer({
  html,
  images,
  footnotes,
  onReferenceClick
}: {
  html: string;
  images: Record<string, string>;
  footnotes: Record<string, string>;
  onReferenceClick: (ref: { label: string; url: string }) => void;
}) {
  const processedHtml = useMemo(() => {
    if (!html) return "";

    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    let result = html.replace(/jwpub-media:\/\/([^\s"'<>]+)/g, (match, id) => {
      return images[id] || placeholder;
    });

    Object.entries(images).forEach(([id, blobUrl]) => {
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const srcRegex = new RegExp(`src\\s*=\\s*["']?\\s*${escapedId}\\s*["']?`, 'g');
      result = result.replace(srcRegex, `src="${blobUrl}"`);
    });

    return result;
  }, [html, images]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('jwpub://f/')) {
        e.preventDefault();
        const fId = href.split('/').pop();
        if (fId && footnotes[fId]) {
          onReferenceClick({
            label: `Nota de Rodapé`,
            url: footnotes[fId]
          });
        }
      } else if (href.startsWith('jwpub://b/')) {
        e.preventDefault();
        onReferenceClick({
          label: link.textContent || "Referência Bíblica",
          url: href
        });
      } else if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetEl = node.querySelector(`[id="${targetId}"], [name="${targetId}"]`);

        if (targetEl) {
          window.history.replaceState(null, '', `${window.location.pathname}#${targetId}`);

          onReferenceClick({
            label: `Nota: ${link.textContent}`,
            url: targetEl.innerHTML
          });
        }
      }
    };

    node.addEventListener('click', handleLinkClick);
    return () => node.removeEventListener('click', handleLinkClick);
  }, [footnotes, onReferenceClick]);

  return (
    <div
      ref={containerRef}
      className="jwpub-content"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}