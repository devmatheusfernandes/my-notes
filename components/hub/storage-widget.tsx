"use client";

import { useEffect } from "react";
import { useStorageStore } from "@/store/storageStore";
import { useAuthStore } from "@/store/authStore";
import { Progress } from "@/components/ui/progress";
import { Cloud, RefreshCw, Image as ImageIcon, FileText, StickyNote } from "lucide-react";
import bytes from "bytes";
import { storageService } from "@/services/storageService";
import { toast } from "sonner";
import { useState } from "react";

export function StorageWidget() {
  const { user } = useAuthStore();
  const { usage, limitBytes, subscribeToUsage, isLoading: isStoreLoading } = useStorageStore();
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUsage(user.uid);
      return () => unsubscribe();
    }
  }, [user?.uid, subscribeToUsage]);

  const handleRecalculate = async () => {
    if (!user?.uid) return;
    setIsRecalculating(true);
    try {
      await storageService.recalculateUsage(user.uid);
      toast.success("Uso de armazenamento recalculado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao recalcular armazenamento.");
    } finally {
      setIsRecalculating(false);
    }
  };

  if (!user || isStoreLoading) return null;

  const usedBytes = usage.totalBytesUsed + (usage.notesBytesUsed || 0);
  const percentage = Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100));

  const formattedUsed = bytes(usedBytes, {
    decimalPlaces: 1,
    unitSeparator: " ",
  });
  const formattedLimit = bytes(limitBytes, {
    decimalPlaces: 0,
    unitSeparator: " ",
  });

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">
            Armazenamento
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors disabled:opacity-50"
            title="Recalcular uso"
          >
            <RefreshCw className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`} />
          </button>
          <span className="text-sm font-medium text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Progress value={percentage} className="h-2.5" />
          <p className="text-xs text-muted-foreground font-medium">
            {formattedUsed} de {formattedLimit} utilizados
          </p>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-dashed">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <ImageIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Imagens</span>
              <span className="text-xs font-semibold">{bytes(usage.imageBytesUsed || 0, { unitSeparator: " " })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l pl-3">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">PDFs</span>
              <span className="text-xs font-semibold">{bytes(usage.pdfBytesUsed || 0, { unitSeparator: " " })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l pl-3">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <StickyNote className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Notas & Pastas</span>
              <span className="text-xs font-semibold">{bytes(usage.notesBytesUsed || 0, { unitSeparator: " " })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
