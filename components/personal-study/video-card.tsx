"use client";

import { VideoData } from "@/schemas/videos";
import { Clock, Play, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { HighlightedSnippet } from "./../search/highlighted-snippet";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: VideoData;
  searchQuery?: string;
  variant?: "grid" | "list";
}

export function VideoCard({ video, searchQuery, variant = "grid" }: VideoCardProps) {
  const hasSearch = searchQuery && searchQuery.trim().length > 0;
  const isList = variant === "list";

  return (
    <Link
      href={`/hub/personal-study/video/${video.id}${hasSearch ? `?h=${encodeURIComponent(searchQuery)}` : ""}`}
      className={cn(
        "group relative flex rounded-sm overflow-hidden bg-card border border-border/50 transition-all hover:bg-accent/5",
        isList ? "flex-row gap-4 h-auto p-2" : "flex-col gap-2 h-full"
      )}
    >
      <div className={cn(
        "relative aspect-video overflow-hidden bg-muted shrink-0 rounded-xs",
        isList ? "w-32 sm:w-48 lg:w-56" : "w-full"
      )}>
        {video.coverImage ? (
          <Image
            width={500}
            height={500}
            src={video.coverImage}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.durationFormatted}
        </div>

        {video.importedAsNote && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-blue-500/90 text-white border-none shadow-sm gap-1 py-0.5">
              <BookOpen className="w-3 h-3" />
              Importado
            </Badge>
          </div>
        )}
      </div>

      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        isList ? "justify-center gap-2 pr-2" : "px-2 pb-2.5 gap-1.5"
      )}>
        <h3 className={cn(
          "font-semibold text-foreground leading-tight group-hover:text-primary transition-colors",
          isList ? "text-sm sm:text-base line-clamp-1" : "text-[13px] line-clamp-2"
        )}>
          {video.title}
        </h3>

        {hasSearch && video.contentText && (
          <div className={cn(isList ? "block" : "hidden sm:block")}>
            <HighlightedSnippet
              text={video.contentText}
              term={searchQuery}
              symbol="video"
              asDiv={isList}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
