"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useJwpub } from "@/hooks/use-jwpub";
import { useSettings } from "@/hooks/use-settings";
import { useAuthStore } from "@/store/authStore";
import { JwpubPublication } from "@/schemas/jwpubSchema";
import { indexedDbService } from "@/services/indexedDbService";
import { Loading } from "@/components/ui/loading";
import { BookOpen, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Refactored Components
import { useReaderStore } from "@/store/readerStore";
import { ReaderHeader } from "@/components/jwpub/ReaderHeader";
import { ReaderPrevButton } from "@/components/jwpub/ReaderPrevButton";
import { ReaderNextButton } from "@/components/jwpub/ReaderNextButton";
import { ReaderHome } from "@/components/jwpub/ReaderHome";
import { ChapterRenderer } from "@/components/jwpub/ChapterRenderer";
import { ChapterCover } from "@/components/jwpub/ChapterCover";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { publicationService } from "@/services/publicationService";
​
export default function JwpubReaderPage() {
    const { symbol } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { getPublication } = useJwpub();
    const { user } = useAuthStore();
    const { fetchSettings } = useSettings();
​
    const [pub, setPub] = useState<JwpubPublication | null>(null);
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState<Record<string, string>>({});
​
    const {
        setCurrentChapterIndex,
        direction,
        setDirection,
        activeReferences,
        addReference,
        removeReference,
        reset
    } = useReaderStore();
​
    const currentChapterIndex = useReaderStore(s => s.currentChapterIndex);
​
    useEffect(() => {
        if (user?.uid) {
            fetchSettings(user.uid);
        }
    }, [user?.uid, fetchSettings]);
​
    useEffect(() => {
        if (!symbol) return;
​
        const loadPublication = async () => {
            setLoading(true);
            try {
                const data = await getPublication(symbol as string);
                setPub(data);
​
                const c = parseInt(searchParams.get("c") || "0", 10);
                if (isNaN(c) || c < 0 || (data && c >= data.chapters.length)) {
                    setCurrentChapterIndex(0);
                    router.replace(`?c=0`);
                } else {
                    setCurrentChapterIndex(c);
                }
            } catch (err) {
                console.error("Erro ao carregar publicação:", err);
            } finally {
                setLoading(false);
            }
        };
​
        loadPublication();
​
        return () => reset();
    }, [symbol, getPublication, router, searchParams, setCurrentChapterIndex, reset]);
​
    const updateChapterIndex = useCallback((index: number) => {
        const newDir = index > currentChapterIndex ? 1 : -1;
        setDirection(newDir);
        setCurrentChapterIndex(index);
        router.push(`?c=${index}`, { scroll: false });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentChapterIndex, router, setCurrentChapterIndex, setDirection]);
​
    const currentChapter = pub?.chapters[currentChapterIndex];
​
    useEffect(() => {
        if (!currentChapter) return;
​
        const loadImages = async () => {
            const fetchedImages: Record<string, string> = {};
            const imageIds = new Set<string>();
​
            const mediaMatches = currentChapter.html.matchAll(/jwpub-media:\/\/([^\s"'<>]+)/g);
            for (const match of mediaMatches) imageIds.add(match[1]);
​
            const srcMatches = currentChapter.html.matchAll(/src=["']([^"'<>]+?\.(?:jpg|png|svg|webp|gif))["']/g);
            for (const match of srcMatches) {
                if (!match[1].startsWith('data:') && !match[1].startsWith('blob:')) {
                    imageIds.add(match[1].split('/').pop()!);
                }
            }
​
            for (const id of Array.from(imageIds)) {
                const imgData = await indexedDbService.getImage(id);
                if (imgData) {
                    fetchedImages[id] = URL.createObjectURL(imgData.blob);
                }
            }
​
            setImages(prev => ({ ...prev, ...fetchedImages }));
        };
​
        loadImages();
    }, [currentChapter]);
​
    const firstImageId = useMemo(() => {
        if (!currentChapter) return null;
        const mediaMatch = currentChapter.html.match(/jwpub-media:\/\/([^\s"'<>]+)/);
        if (mediaMatch) return mediaMatch[1];
​
        const srcMatch = currentChapter.html.match(/src=["']([^"'<>]+?\.(?:jpg|png|svg|webp|gif))["']/);
        if (srcMatch) return srcMatch[1].split('/').pop();
​
        return null;
    }, [currentChapter]);
​
    const handleNextChapter = useCallback(() => {
        if (pub) {
            const nextIdx = currentChapterIndex === 0 ? 2 : currentChapterIndex + 1;
            if (nextIdx < pub.chapters.length) updateChapterIndex(nextIdx);
        }
    }, [pub, currentChapterIndex, updateChapterIndex]);
​
    const handlePrevChapter = useCallback(() => {
        const prevIdx = currentChapterIndex === 2 ? 0 : currentChapterIndex - 1;
        if (prevIdx >= 0) updateChapterIndex(prevIdx);
    }, [currentChapterIndex, updateChapterIndex]);
​
    const handleReferenceClick = async (ref: { label: string; url: string }) => {
        if (ref.url.startsWith("jwpub://p/")) {
            const parsed = publicationService.parseJwpubUrl(ref.url);
            if (parsed) {
                const content = await publicationService.getContent(parsed.symbol, parsed.chapterIndex, parsed.paragraphIndex);
                if (content) {
                    addReference({
                        label: `${content.bookTitle} - ${ref.label}`,
                        content: content.content,
                        type: "footnote"
                    });
                    return;
                }
            }
        }

        if (ref.url.startsWith("jwpub://b/")) {
            const parsed = publicationService.parseBibleUrl(ref.url);
            if (parsed && parsed.verses.length > 0) {
                try {
                    const res = await fetch(`/api/bible?v=NWT&b=${encodeURIComponent(parsed.book)}&c=${parsed.chapter}`);
                    if (res.ok) {
                        const data = await res.json();
                        const versesText = parsed.verses.map(vNum => {
                            const found = data.verses.find((v: { verse: number; text: string }) => v.verse === vNum);
                            return found ? `<p><sup class="text-[10px] mr-1 text-primary animate-pulse">${vNum}</sup>${found.text}</p>` : "";
                        }).join("");

                        if (versesText) {
                            const labelStr = parsed.verses.length > 1 
                                ? `${parsed.book} ${parsed.chapter}:${parsed.verses[0]}-${parsed.verses[parsed.verses.length - 1]}`
                                : `${parsed.book} ${parsed.chapter}:${parsed.verses[0]}`;

                            addReference({
                                label: labelStr,
                                content: versesText,
                                type: "bible"
                            });
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch bible reference:", e);
                }
            }
        }
​
        // Fallback or Footnote
        addReference({
            label: ref.label,
            content: ref.url,
            type: ref.url.startsWith("jwpub://b/") ? "bible" : "footnote"
        });
    };
​
    if (loading) return <Loading />;

  if (!pub) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold">Publicação não encontrada</h2>
        <Button onClick={() => router.push("/hub/personal-study")}>Voltar para Biblioteca</Button>
      </div>
    );
  }

  const sidebarContent = (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
      {activeReferences.length > 0 ? (
        activeReferences.map((ref) => (
          <div key={ref.id} className="group relative bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-800">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Info className="w-3 px-0 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  {ref.label}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeReference(ref.id)}
              >
                <X className="w-3 h-3 text-zinc-400" />
              </Button>
            </div>
            <div className="jwpub-content text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {ref.content.startsWith("jwpub://b/") ? (
                <div className="py-2 text-muted-foreground italic text-[11px]">
                  Referência Bíblica ativa.
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: ref.content }} />
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="h-40 flex flex-col items-center justify-center text-center px-6">
          <BookOpen className="w-8 h-8 text-zinc-200 dark:text-zinc-800 mb-3" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
            Notas & Referências
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">
            Clique em uma nota ou texto bíblico para visualizar aqui.
          </p>
        </div>
      )}

      {currentChapterIndex > 0 && (
        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 px-2">
            Metadados do Artigo
          </h4>
          <div className="space-y-4 px-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-medium">Título Original</span>
              <span className="text-xs font-bold font-serif italic text-zinc-800 dark:text-zinc-300">
                {currentChapter?.title}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-medium">Publicação</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300">
                {pub.title}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <SidebarLayout sidebarContent={sidebarContent}>
      <ReaderHeader pub={pub} />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex w-full max-w-5xl mx-auto relative min-h-screen">
          <ReaderPrevButton />

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
                {currentChapterIndex === 0 ? (
                  <ReaderHome pub={pub} onSelectChapter={updateChapterIndex} />
                ) : (
                  currentChapter && (
                    <>
                      <ChapterCover imageUrl={firstImageId ? images[firstImageId] : undefined} />
                      <article className="px-4 sm:px-0 mb-4">
                        <ChapterRenderer
                          html={currentChapter.html}
                          images={images}
                          footnotes={pub.footnotes || {}}
                          onReferenceClick={handleReferenceClick}
                          skipImageId={firstImageId || undefined}
                        />
                      </article>
                    </>
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <ReaderNextButton pub={pub} />
        </div>
      </div>
    </SidebarLayout>
  );
}