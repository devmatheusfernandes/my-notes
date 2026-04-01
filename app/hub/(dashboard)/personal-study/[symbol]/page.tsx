"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useJwpub } from "@/hooks/use-jwpub";
import { JwpubPublication } from "@/schemas/jwpubSchema";
import { indexedDbService } from "@/services/indexedDbService";
import { Loading } from "@/components/ui/loading";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

// Refactored Components
import { useReaderStore } from "@/store/readerStore";
import { ReaderHeader } from "@/components/jwpub/ReaderHeader";
import { ReaderPrevButton } from "@/components/jwpub/ReaderPrevButton";
import { ReaderNextButton } from "@/components/jwpub/ReaderNextButton";
import { ReaderHome } from "@/components/jwpub/ReaderHome";
import { ChapterRenderer } from "@/components/jwpub/ChapterRenderer";
import { ChapterCover } from "@/components/jwpub/ChapterCover";
import { ReferenceModal } from "@/components/jwpub/ReferenceModal";

export default function JwpubReaderPage() {
  const { symbol } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPublication } = useJwpub();

  // Local Data State
  const [pub, setPub] = useState<JwpubPublication | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<Record<string, string>>({});

  // Store State
  const {
    currentChapterIndex,
    setCurrentChapterIndex,
    direction,
    setDirection,
    setActiveReference,
    reset
  } = useReaderStore();

  // 1. Initial Load & Sync with URL
  useEffect(() => {
    if (!symbol) return;

    const loadPublication = async () => {
      setLoading(true);
      try {
        const data = await getPublication(symbol as string);
        setPub(data);

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

    loadPublication();

    // Cleanup store on unmount
    return () => reset();
  }, [symbol, getPublication, router, searchParams, setCurrentChapterIndex, reset]);

  // 2. Navigation Helper
  const updateChapterIndex = useCallback((index: number) => {
    const newDir = index > currentChapterIndex ? 1 : -1;
    setDirection(newDir);
    setCurrentChapterIndex(index);
    router.push(`?c=${index}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentChapterIndex, router, setCurrentChapterIndex, setDirection]);

  // 3. Image Loading Logic
  const currentChapter = pub?.chapters[currentChapterIndex];

  useEffect(() => {
    if (!currentChapter) return;

    const loadImages = async () => {
      const fetchedImages: Record<string, string> = {};
      const imageIds = new Set<string>();

      const mediaMatches = currentChapter.html.matchAll(/jwpub-media:\/\/([^\s"'<>]+)/g);
      for (const match of mediaMatches) imageIds.add(match[1]);

      const srcMatches = currentChapter.html.matchAll(/src=["']([^"'<>]+?\.(?:jpg|png|svg|webp|gif))["']/g);
      for (const match of srcMatches) {
        if (!match[1].startsWith('data:') && !match[1].startsWith('blob:')) {
          imageIds.add(match[1].split('/').pop()!);
        }
      }

      for (const id of Array.from(imageIds)) {
        const imgData = await indexedDbService.getImage(id);
        if (imgData) {
          fetchedImages[id] = URL.createObjectURL(imgData.blob);
        }
      }

      setImages(prev => ({ ...prev, ...fetchedImages }));
    };

    loadImages();
  }, [currentChapter]);

  // Extract first image ID for the cover
  const firstImageId = useMemo(() => {
    if (!currentChapter) return null;
    const mediaMatch = currentChapter.html.match(/jwpub-media:\/\/([^\s"'<>]+)/);
    if (mediaMatch) return mediaMatch[1];

    const srcMatch = currentChapter.html.match(/src=["']([^"'<>]+?\.(?:jpg|png|svg|webp|gif))["']/);
    if (srcMatch) return srcMatch[1].split('/').pop();

    return null;
  }, [currentChapter]);

  // 4. Swipe Handlers
  const handleNextChapter = useCallback(() => {
    if (pub) {
      const nextIdx = currentChapterIndex === 0 ? 2 : currentChapterIndex + 1;
      if (nextIdx < pub.chapters.length) updateChapterIndex(nextIdx);
    }
  }, [pub, currentChapterIndex, updateChapterIndex]);

  const handlePrevChapter = useCallback(() => {
    const prevIdx = currentChapterIndex === 2 ? 0 : currentChapterIndex - 1;
    if (prevIdx >= 0) updateChapterIndex(prevIdx);
  }, [currentChapterIndex, updateChapterIndex]);

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

  return (
    <div className="flex flex-col h-full">
      <ReaderHeader pub={pub} />

      <div className="flex-1 flex w-full max-w-5xl mx-auto relative min-h-screen shadow-sm">
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
                    <article className="px-4 sm:px-0">
                      <ChapterRenderer
                        html={currentChapter.html}
                        images={images}
                        footnotes={pub.footnotes || {}}
                        onReferenceClick={setActiveReference}
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

      <ReferenceModal />
    </div>
  );
}