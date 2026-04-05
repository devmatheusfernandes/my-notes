"use client";

import { useState } from "react";
import useSWR from "swr";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Brain,
  CheckCircle2,
  PlayCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BulkImportStatus() {
  const { data, error, isLoading: isFetchingStatus, mutate } = useSWR("/api/notes/import/status", fetcher, {
    refreshInterval: (data) => (data?.isComplete ? 0 : 5000),
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleManualProcess = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/notes/import/process", { method: "POST" });
      const result = await res.json();

      if (result.success) {
        toast.success(`Processados ${result.successCount} itens com sucesso!`);
        mutate(); // Refresh status
      } else {
        toast.info(result.message || "Nenhum item pendente.");
      }
    } catch (err) {
      toast.error("Erro ao iniciar processamento manual.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) return null;
  if (isFetchingStatus && !data) return null;
  if (!data || data.total === 0) return null;

  const percentage = data.total > 0 ? Math.round((data.synced / data.total) * 100) : 0;
  const isComplete = data.isComplete;

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-semibold text-foreground block leading-none">
              Busca Semântica
            </span>
            <span className="text-xs text-muted-foreground">
              {isComplete ? "Tudo sincronizado" : "Processando base de conhecimento"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualProcess}
              disabled={isProcessing}
              className="h-8 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Continuar Processo</span>
            </Button>
          )}

          <button
            onClick={() => mutate()}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
            title="Atualizar status"
          >
            <RefreshCw className={`h-4 w-4 ${isFetchingStatus ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-end mb-1">
            <p className="text-xs text-muted-foreground font-medium">
              {data.synced} de {data.total} itens processados
            </p>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              isComplete ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
            )}>
              {percentage}%
            </span>
          </div>
          <Progress value={percentage} className="h-2.5" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-dashed">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Sincronizados: {data.synced}</span>
            </div>
            {data.error > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Erros: {data.error}</span>
              </div>
            )}
          </div>

          {isComplete && (
            <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3" />
              Concluído
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
