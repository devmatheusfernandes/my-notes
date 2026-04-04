"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { VideoData } from "@/schemas/videos";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Play, Clock, BookOpen, ExternalLink, Share2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatVttToText } from "@/lib/video/video-utils";
import { videoService } from "@/lib/video/video-service";

export default function VideoPlaybackPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);

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

        setVideo(data);
      } catch (err) {
        console.error("Error fetching video:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

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

    const termRegex = /(['"])(.*?)\1|(\S+)/g;
    const cleanQuery = highlightTerm.replace(/[,\.]/g, " ");
    const terms: string[] = [];
    let match;
    while ((match = termRegex.exec(cleanQuery)) !== null) {
      const t = (match[2] || match[3] || "").trim();
      if (t.length > 1) terms.push(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    }

    if (terms.length === 0) return paras;

    const highlightPattern = new RegExp(`(${terms.join("|")})`, "gi");
    
    return paras.map(p => 
      p.replace(highlightPattern, (m) => 
        `<mark class="bg-yellow-400/30 dark:bg-yellow-500/50 rounded-sm px-0.5 ring-1 ring-yellow-400/20 text-foreground video-highlight">${m}</mark>`
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
          <Button className="gap-2 rounded-full shadow-sm">
            <BookOpen className="w-4 h-4" />
            Criar Nota
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
                <Button className="w-full justify-start gap-3 h-12 rounded-xl" variant="outline">
                  <BookOpen className="w-5 h-5" />
                  Ver notas vinculadas
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
