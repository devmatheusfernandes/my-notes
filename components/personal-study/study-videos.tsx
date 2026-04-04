"use client";

import { useMemo, useEffect, useState } from "react"
import { CategoryGroup, VideoData } from "@/schemas/videos";
import { VideoCard } from "./video-card";
import { Ghost, Clock, Loader2, Plus, SearchX } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { videoService } from "@/lib/video/video-service";
import { getAllVideosGrouped } from "@/lib/video/video-crawler";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loading } from "../ui/loading";

interface StudyVideosProps {
  searchQuery: string;
  searchResults: VideoData[];
  isSearching: boolean;
}

export function StudyVideos({ searchQuery, searchResults, isSearching }: StudyVideosProps) {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["VODPgmEvtMorningWorship"]);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    setVisibleCount(9);
  }, [searchQuery, selectedCategories]);

  useEffect(() => {
    const init = async () => {
      try {
        const [data, lastUpd] = await Promise.all([
          getAllVideosGrouped(),
          videoService.getLastUpdated()
        ]);
        setGroups(data);
        setLastUpdated(lastUpd);
      } catch (err) {
        console.error("Failed to initialize videos:", err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const hasSearch = searchQuery.trim().length > 0;

  const displayGroups = useMemo(() => {
    if (selectedCategories.length === 0) return groups;
    return groups.filter(g => selectedCategories.includes(g.key));
  }, [groups, selectedCategories]);

  const totalVideos = useMemo(() =>
    displayGroups.flatMap(g => g.videos).length,
    [displayGroups]);

  const allVideos = useMemo(() => {
    if (hasSearch) return searchResults;
    return displayGroups.flatMap(g => g.videos);
  }, [hasSearch, searchResults, displayGroups]);

  const slicedVideos = useMemo(() => allVideos.slice(0, visibleCount), [allVideos, visibleCount]);

  if (isLoading) {
    return (
      <Loading />
    );
  }

  return (
    <div className="max-w-5xl flex-1 overflow-y-auto">
      <div className="mx-auto p-4 md:p-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="page-title leading-tight">Vídeos</h2>
                {isSearching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {lastUpdated ? (
                  <>
                    <Clock className="w-3 h-3" />
                    Sincronizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}
                  </>
                ) : (
                  "Sincronizando pela primeira vez..."
                )}
              </div>
            </div>
            <div className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/40">
              {hasSearch ? `${searchResults.length} ENCONTRADOS` : `${totalVideos} DISPONÍVEIS`}
            </div>
          </div>

          {!hasSearch && groups.length > 0 && (
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {groups.map((group) => (
                  <button
                    key={group.key}
                    onClick={() => {
                      if (selectedCategories.includes(group.key)) {
                        setSelectedCategories(prev => prev.filter(k => k !== group.key))
                      } else {
                        setSelectedCategories(prev => [...prev, group.key])
                      }
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
                      selectedCategories.includes(group.key)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {group.title.toUpperCase()}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible sm:visible" />
            </ScrollArea>
          )}

          <div className="flex-1 max-h-[calc(86vh-100px)] overflow-y-auto custom-scrollbar">
            {slicedVideos.length > 0 ? (
              <div className={cn(
                "grid gap-x-4 gap-y-6",
                hasSearch ? "flex flex-col gap-4" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              )}>
                {slicedVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    searchQuery={searchQuery}
                    variant={hasSearch ? "list" : "grid"}
                  />
                ))}
              </div>
            ) : (
              <NoResults
                title={selectedCategories.length > 0 ? "Nenhum vídeo nessas categorias" : undefined}
                searchQuery={searchQuery}
              />
            )}

            {visibleCount < allVideos.length && (
              <div className="flex justify-center pt-8 pb-12">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount(prev => prev + 9)}
                  className="rounded-full px-8 h-12 font-bold gap-2 text-foreground"
                >
                  Carregar Mais
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NoResults({ title, searchQuery }: { title?: string; searchQuery?: string }) {
  const hasSearch = searchQuery && searchQuery.trim().length > 0;

  return (
    <Empty className="py-24 border-none">
      <EmptyContent>
        <EmptyMedia variant="icon">
          {hasSearch ? <SearchX /> : <Ghost />}
        </EmptyMedia>
        <EmptyTitle>{title || (hasSearch ? "Nenhum vídeo encontrado" : "Nenhum vídeo disponível")}</EmptyTitle>
        <EmptyDescription>
          {hasSearch
            ? `Sua busca por "${searchQuery}" não retornou nenhum vídeo na sua biblioteca local.`
            : "Tente um termo diferente ou mude seus filtros de categoria."
          }
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  );
}
