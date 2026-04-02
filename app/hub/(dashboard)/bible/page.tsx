"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { BibleHeader } from "@/components/bible/BibleHeader";
import { BibleReader } from "@/components/bible/BibleReader";
import { BibleSelectorGrid } from "@/components/bible/BibleSelectorGrid";
import { BibleSearchResults } from "@/components/bible/BibleSearchResults";
import { BibleTranslationDrawer } from "@/components/bible/BibleTranslationDrawer";
import { CrossReferencesSidebar } from "@/components/bible/CrossReferencesSidebar";
import { useReaderStore } from "@/store/readerStore";

function BibleContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const version = searchParams.get("v") || "NWT";
    const book = searchParams.get("b") || "";
    const chapter = parseInt(searchParams.get("c") || "0", 10);
    const verse = parseInt(searchParams.get("vs") || "0", 10);
    const q = searchParams.get("q") || "";

    const [verses, setVerses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(!!q);
    const [isTranslationsOpen, setIsTranslationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(q);

    const isSidebarOpen = useReaderStore((s) => s.isSidebarOpen);
    const setIsSidebarOpen = useReaderStore((s) => s.setIsSidebarOpen);

    useEffect(() => {
        if (book && chapter) {
            const fetchVerses = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/bible?v=${version}&b=${encodeURIComponent(book)}&c=${chapter}`);
                    if (res.ok) {
                        const data = await res.json();
                        setVerses(data.verses);
                    }
                } catch (e) {
                    console.error("Failed to fetch verses:", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchVerses();
        } else {
            setVerses([]);
        }
    }, [version, book, chapter]);

    const updateParams = (params: Record<string, string | number | null>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            if (value === null) newParams.delete(key);
            else newParams.set(key, String(value));
        });
        router.push(`${pathname}?${newParams.toString()}`);
    };

    const handleSelectBook = (selectedBook: any) => {
        if (!selectedBook) {
            updateParams({ b: null, c: null, vs: null });
        } else {
            updateParams({ b: selectedBook.name, c: null, vs: null });
        }
    };

    const handleSelectChapter = (selectedBook: any, selectedChapter: number) => {
        updateParams({ b: selectedBook.name, c: selectedChapter, vs: null, q: null });
        setIsSearchActive(false);
    };

    const handleVerseClick = (selectedVerse: number) => {
        updateParams({ vs: selectedVerse });
        setIsSidebarOpen(true);
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim().length >= 2) {
            updateParams({ q: searchQuery, b: null, c: null, vs: null });
        }
    };

    const handleNavigate = (b: string, c: number, vs: number) => {
        updateParams({ b, c, vs });
        // Optionally closing search if active, though not strictly required here
    };

    const currentBookObj = book ? { name: book, chapters: 0 } as any : null;

    return (
        <SidebarLayout
            sidebarContent={
                isSidebarOpen ? (
                    <CrossReferencesSidebar
                        book={book}
                        chapter={chapter}
                        verse={verse > 0 ? verse : null}
                        version={version}
                        onNavigate={handleNavigate}
                    />
                ) : null
            }
        >
            <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
                <BibleHeader
                    version={version}
                    book={book}
                    chapter={chapter}
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    onSearchSubmit={handleSearchSubmit}
                    isSearchActive={isSearchActive}
                    setIsSearchActive={setIsSearchActive}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    onBack={book || q ? () => {
                        if (q) {
                            updateParams({ q: null });
                            setIsSearchActive(false);
                            setSearchQuery("");
                        } else {
                            handleSelectBook(null);
                        }
                    } : undefined}
                    onOpenTranslations={() => setIsTranslationsOpen(true)}
                />

                <main className="flex-1 overflow-hidden flex flex-col relative">
                    {q ? (
                        <BibleSearchResults
                            query={q}
                            version={version}
                            onSelectVerse={(b: string, c: number, vs: number) => {
                                updateParams({ b, c, vs, q: null });
                                setIsSearchActive(false);
                                setSearchQuery("");
                            }}
                        />
                    ) : !book || !chapter ? (
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <BibleSelectorGrid
                                selectedBook={currentBookObj}
                                onSelectBook={handleSelectBook}
                                onSelectChapter={handleSelectChapter}
                            />
                        </div>
                    ) : (
                        <BibleReader
                            verses={verses}
                            isLoading={loading}
                            highlightedVerse={verse > 0 ? verse : null}
                            onVerseClick={handleVerseClick}
                        />
                    )}

                    <BibleTranslationDrawer
                        isOpen={isTranslationsOpen}
                        onClose={() => setIsTranslationsOpen(false)}
                        currentVersion={version}
                        onSelect={(v) => updateParams({ v })}
                    />
                </main>
            </div>
        </SidebarLayout>
    );
}

export default function BiblePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Iniciando Escrituras...</div>}>
            <BibleContent />
        </Suspense>
    );
}
