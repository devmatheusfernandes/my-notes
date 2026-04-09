"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { VideoData } from "@/schemas/videos";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Play, Clock, BookOpen, ExternalLink, Share2, FileText, Check, Loader2, Zap, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatVttToText, parseVttToSegments, TranscriptSegment } from "@/lib/video/video-utils";
import { videoService } from "@/lib/video/video-service";
import { useAuthStore } from "@/store/authStore";
import { useNotes } from "@/hooks/use-notes";
import { useVectorStatus } from "@/hooks/use-vector-status";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function VideoPlaybackPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { createNote } = useNotes(user?.uid);
  const { isVectorized } = useVectorStatus();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImported, setIsImported] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const highlightTerm = searchParams.get("h") || undefined;

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      setLoading(true);
      try {
        const data = await videoService.getVideoById(id as string);

        if (data && data.subtitlesUrl) {
          try {
            const res = await fetch(data.subtitlesUrl);
            const vtt = await res.text();
            if (!data.contentText) {
              data.contentText = formatVttToText(vtt);
            }
            const parsedSegments = parseVttToSegments(vtt);
            setSegments(parsedSegments);
          } catch (err) {
            console.error("Error loading subtitles:", err);
          }
        }

        if (user && data) {
          const userState = await videoService.getUserVideoState(user.uid, data.id);
          if (userState?.importedAsNote) {
            setIsImported(true);
          }
        }

        setVideo(data);
      } catch (err) {
        console.error("Error fetching video:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id, user]);

  const handleCreateNote = useCallback(async () => {
    if (!user) {
      toast.error("Você precisa estar logado para criar notas.");
      return;
    }
    if (isImported) {
      toast.error("Este vídeo já foi importado como nota.");
      return;
    }
    if (!video || !video.contentText) {
      toast.error("Não há conteúdo disponível para criar uma nota.");
      return;
    }

    setIsCreating(true);
    try {
      const fullTitle = `Nota: ${video.title}`;
      const truncatedTitle = fullTitle.length > 150 ? fullTitle.substring(0, 147) + "..." : fullTitle;

      const newNote = await createNote(user.uid, {
        title: truncatedTitle,
        content: video.contentText,
        type: "note",
      });

      if (newNote) {
        await videoService.setVideoNoteLink(user.uid, video.id, newNote.id);
        setIsImported(true);
        toast.success("Nota criada com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao criar nota:", err);
      toast.error("Erro ao criar nota a partir do vídeo.");
    } finally {
      setIsCreating(false);
    }
  }, [user, video, createNote, isImported]);

  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElem.currentTime);
    };

    videoElem.addEventListener("timeupdate", handleTimeUpdate);
    return () => videoElem.removeEventListener("timeupdate", handleTimeUpdate);
  }, [video, loading]);

  const activeSegmentIndex = useMemo(() => {
    if (segments.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].startTime <= currentTime + 0.1) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [segments, currentTime]);

  useEffect(() => {
    if (autoScroll && activeSegmentIndex !== -1 && !loading) {
      const activeElement = document.getElementById(`segment-${activeSegmentIndex}`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeSegmentIndex, autoScroll, loading]);

  useEffect(() => {
    if (highlightTerm && !loading && video) {
      const timer = setTimeout(() => {
        const firstHighlight = document.querySelector(".video-highlight");
        if (firstHighlight) {
          firstHighlight.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightTerm, loading, video]);

  const highlightedSegments = useMemo(() => {
    if (segments.length === 0) return [];
    if (!highlightTerm) return segments;

    const escapedTerm = highlightTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escapedTerm) return segments;

    const highlightPattern = new RegExp(`(${escapedTerm})`, "gi");

    return segments.map(s => ({
      ...s,
      text: s.text.replace(highlightPattern, (m) =>
        `<mark class="bg-amber-400/50 dark:bg-amber-500/50 rounded-sm px-1 shadow-sm text-foreground video-highlight font-medium">${m}</mark>`
      )
    }));
  }, [segments, highlightTerm]);

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => { });
    }
  };

  if (loading) return <Loading />;

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-5 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Play className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Vídeo não encontrado</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Não conseguimos localizar o vídeo solicitado.
          </p>
        </div>
        <Button onClick={() => router.push("/hub/personal-study")} variant="default" className="mt-4 rounded-full px-8">
          Voltar para Vídeos
        </Button>
      </div>
    );
  }

  return (
    // Container principal: Trava a altura em 100vh para permitir rolagem individual interna
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">

      {/* Top Bar Fixa (Altura controlada h-14/16) */}
      <header className="h-14 md:h-16 shrink-0 border-b bg-background z-50 flex items-center justify-between px-3 md:px-6">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 pr-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full shrink-0 h-9 w-9 md:h-11 md:w-11"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1 className="text-sm md:text-base font-semibold truncate">
              {video.title}
            </h1>
            <p className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground font-medium truncate">
              {video.primaryCategory || "Vídeo"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={autoScroll ? "default" : "ghost"}
            size="icon"
            className={cn(
              "rounded-full transition-all",
              autoScroll ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            )}
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? "Desativar acompanhamento" : "Ativar acompanhamento automático"}
          >
            <Zap className={cn("w-4 h-4 md:w-5 md:h-5", autoScroll && "fill-current")} />
          </Button>

          <Button variant="ghost" size="icon" className="hidden md:flex rounded-full">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            className={cn(
              "gap-2 rounded-full shadow-sm transition-all h-9 md:h-10 px-4 md:px-5",
              isImported && "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
            onClick={handleCreateNote}
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isImported ? (
              <Check className="w-4 h-4" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isImported ? "Importado" : "Criar Nota"}
            </span>
          </Button>
        </div>
      </header>

      {/* Corpo da Página 
        Mobile: O container rola tudo `overflow-y-auto`
        Desktop: O container esconde `lg:overflow-hidden` forçando os painéis a rolarem independentemente 
      */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">

        {/* LADO ESQUERDO: VÍDEO E METADADOS */}
        <div className="w-full lg:w-[60%] xl:w-[65%] flex flex-col lg:h-full lg:overflow-y-auto lg:border-r border-border/50 relative bg-background max-lg:contents">

          {/* Vídeo - Fixo no topo do container (Sticky) */}
          <div className="sticky top-0 z-40 w-full bg-black shadow-sm flex-shrink-0">
            <div className="aspect-video w-full relative">
              {video.videoUrl ? (
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  poster={video.coverImage}
                  controls
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 space-y-4">
                  <Play className="w-10 h-10 text-white/50" />
                  <p className="text-sm text-zinc-400">Streaming não disponível</p>
                </div>
              )}
            </div>
          </div>

          {/* Informações Abaixo do Vídeo */}
          <div className="p-5 md:p-8 space-y-6 flex-1 bg-background">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium bg-muted/60">
                  <Clock className="w-3 h-3 mr-1.5 inline" />
                  {video.durationFormatted}
                </Badge>
                {video && isVectorized(video.id, "video") && (
                  <Badge variant="default" className="rounded-full px-3 py-1 font-medium bg-emerald-500/15 text-emerald-700 border-none">
                    <Database className="w-3 h-3 mr-1.5 inline" />
                    Vetorizado
                  </Badge>
                )}
                {video.book && (
                  <Badge variant="outline" className="rounded-full px-3 py-1 font-medium">
                    {video.book}
                  </Badge>
                )}
                {isImported && (
                  <Badge variant="default" className="rounded-full px-3 py-1 font-medium bg-emerald-500/15 text-emerald-700 border-none">
                    <Check className="w-3 h-3 mr-1.5 inline" />
                    Virou nota
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                {video.title}
              </h2>
            </div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border/40">
              <Button
                className={cn(
                  "w-full justify-start gap-3 h-12 rounded-xl transition-all",
                  isImported ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400" : ""
                )}
                variant={isImported ? "ghost" : "outline"}
                onClick={() => isImported ? router.push("/hub/personal-study") : handleCreateNote()}
              >
                {isImported ? <Check className="w-5 h-5 shrink-0" /> : <BookOpen className="w-5 h-5 shrink-0" />}
                <span className="truncate">{isImported ? "Ver notas vinculadas" : "Criar nota do vídeo"}</span>
              </Button>

              <Button
                className="w-full justify-start gap-3 h-12 rounded-xl"
                variant="outline"
                onClick={() => window.open(`https://www.jw.org/finder?l=pt&srcid=share&prefer=content&applanguage=PT&cmsid=${video.id}`, "_blank")}
              >
                <ExternalLink className="w-5 h-5 shrink-0 text-muted-foreground" />
                <span className="truncate">Abrir no site oficial</span>
              </Button>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: TRANSCRIÇÃO */}
        <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col lg:h-full lg:overflow-y-auto bg-muted/10 relative max-lg:contents">

          {/* Header da Transcrição - Sticky Apenas no Desktop */}
          <div className="lg:sticky lg:top-0 z-30 px-5 py-4 border-y lg:border-t-0 border-border/50 bg-background/95 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              <h4 className="text-sm font-bold uppercase tracking-widest">
                Transcrição
              </h4>
            </div>
          </div>

          {/* Área Rolável de Texto */}
          <div className="flex-1 lg:overflow-y-auto p-4 md:p-6 pb-16 bg-muted/5 dark:bg-muted/10">
            {segments.length > 0 ? (
              <div className="space-y-1">
                {highlightedSegments.map((segment, idx) => (
                  <div
                    key={idx}
                    id={`segment-${idx}`}
                    className={cn(
                      "flex items-start gap-3 md:gap-4 p-2 md:p-3 -mx-2 rounded-xl transition-all duration-300 group relative",
                      activeSegmentIndex === idx
                        ? "bg-primary/10 border-l-4 border-l-primary shadow-sm ring-1 ring-primary/5"
                        : "hover:bg-muted/50 border-l-4 border-l-transparent"
                    )}
                  >
                    <Button
                      variant={activeSegmentIndex === idx ? "default" : "secondary"}
                      size="sm"
                      className={cn(
                        "h-6 md:h-7 px-2 py-0 text-[10px] md:text-xs font-mono shrink-0 rounded-md transition-all mt-0.5",
                        activeSegmentIndex === idx
                          ? "bg-primary text-primary-foreground scale-110 shadow-md ring-2 ring-primary/20"
                          : "bg-primary/5 text-primary border border-primary/10 hover:bg-primary hover:text-primary-foreground"
                      )}
                      onClick={() => handleSeek(segment.startTime)}
                      title={`Ir para ${segment.startTimeFormatted}`}
                    >
                      {segment.startTimeFormatted}
                    </Button>
                    <p
                      className="text-foreground/90 leading-relaxed text-[15px] md:text-base font-serif flex-1"
                      dangerouslySetInnerHTML={{ __html: segment.text }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <BookOpen className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm">Transcrição não disponível para este vídeo.</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}