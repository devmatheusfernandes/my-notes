"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { VideoData } from "@/schemas/videos";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Play, Clock, BookOpen, ExternalLink, Share2, FileText, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatVttToText } from "@/lib/video/video-utils";
import { videoService } from "@/lib/video/video-service";
import { useAuthStore } from "@/store/authStore";
import { useNotes } from "@/hooks/use-notes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function VideoPlaybackPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { createNote } = useNotes(user?.uid);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImported, setIsImported] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const highlightTerm = searchParams.get("h") || undefined;

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      setLoading(true);
      try {
        const data = await videoService.getVideoById(id as string);

        if (data && !data.contentText && data.subtitlesUrl) {
          try {
            const res = await fetch(data.subtitlesUrl);
            const vtt = await res.text();
            data.contentText = formatVttToText(vtt);
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

  // Handle automatic scrolling to highlight
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

  const highlightedParagraphs = useMemo(() => {
    if (!video?.contentText) return [];

    const paras = video.contentText.split("\n\n");
    if (!highlightTerm) return paras;

    const escapedTerm = highlightTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escapedTerm) return paras;

    const highlightPattern = new RegExp(`(${escapedTerm})`, "gi");

    return paras.map(p =>
      p.replace(highlightPattern, (m) =>
        `<mark class="bg-amber-500/30 dark:bg-amber-500/50 rounded-sm px-0.5 ring-1 ring-amber-500/20 text-foreground video-highlight">${m}</mark>`
      )
    );
  }, [video?.contentText, highlightTerm]);

  if (loading) return <Loading />;

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Play className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-bold">Vídeo não encontrado</h2>
        <p className="text-muted-foreground max-w-md">
          Não conseguimos localizar o vídeo solicitado. Ele pode ter sido removido ou o link está incorreto.
        </p>
        <Button onClick={() => router.push("/hub/personal-study")} variant="outline">
          Voltar para Vídeos
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="p-4 md:p-6 flex items-center justify-between border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm md:text-base font-bold truncate max-w-[200px] md:max-w-md">
              {video.title}
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              {video.primaryCategory || "Vídeo"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex gap-2 rounded-full">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
          <Button
            className={cn(
              "gap-2 rounded-full shadow-sm transition-all",
              isImported && "bg-green-600 hover:bg-green-700 text-white"
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
            {isImported ? "Vídeo Importado" : "Criar Nota"}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Player Section */}
        <div className="aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-2xl relative group">
          {video.videoUrl ? (
            <video
              src={video.videoUrl}
              poster={video.coverImage}
              controls
              className="w-full h-full"
              autoPlay
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white p-8 space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Play className="w-12 h-12 text-white fill-white" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">Streaming não disponível</h3>
                <p className="text-zinc-400 max-w-sm text-sm">
                  Este vídeo não possui um link de streaming direto disponível no momento.
                </p>
              </div>
              <Button
                variant="secondary"
                className="rounded-full gap-2"
                onClick={() => window.open(`https://www.jw.org/finder?l=pt&srcid=share&prefer=content&applanguage=PT&cmsid=${video.id}`, "_blank")}
              >
                Ver no JW.ORG
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Metadata section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3">
                  {video.durationFormatted}
                </Badge>
                {video.book && (
                  <Badge variant="secondary" className="rounded-full px-3">
                    {video.book}
                  </Badge>
                )}
                {isImported && (
                  <Badge variant="default" className="rounded-full px-3 bg-green-500/10 text-green-600 border-green-200/50 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800/50 flex gap-1.5 items-center">
                    <Check className="w-3 h-3" />
                    Já virou nota
                  </Badge>
                )}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight underline decoration-primary/30 underline-offset-8">
                {video.title}
              </h2>
            </div>

            <div className="p-8 rounded-3xl bg-muted/20 border border-border/40 space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase tracking-widest">
                  Transcrição
                </h4>
              </div>

              {video.contentText ? (
                <div className="space-y-4">
                  {highlightedParagraphs.map((paragraph, idx) => (
                    <p
                      key={idx}
                      className="text-foreground/80 leading-relaxed text-lg font-serif"
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                  <BookOpen className="w-8 h-8" />
                  <p className="text-sm">Legendas não disponíveis para este vídeo.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                <Button
                  className={cn("w-full justify-start gap-3 h-12 rounded-xl", isImported && "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10")}
                  variant="outline"
                  onClick={() => {
                    if (isImported) {
                      router.push("/hub/personal-study"); // Or direct to the note if we had the note ID stored in state
                    } else {
                      handleCreateNote();
                    }
                  }}
                >
                  {isImported ? <Check className="w-5 h-5 text-green-600" /> : <BookOpen className="w-5 h-5" />}
                  {isImported ? "Ver notas vinculadas" : "Criar nota do vídeo"}
                </Button>
                <Button className="w-full justify-start gap-3 h-12 rounded-xl" variant="outline">
                  <ExternalLink className="w-5 h-5" />
                  Abrir no site oficial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
