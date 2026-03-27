"use client";

import { useEffect } from "react";
import { useStorageStore } from "@/store/storageStore";
import { useAuthStore } from "@/store/authStore";
import { Progress } from "@/components/ui/progress";
import { Cloud } from "lucide-react";
import bytes from "bytes";

export function StorageWidget() {
  const { user } = useAuthStore();
  const { usage, limitBytes, subscribeToUsage, isLoading } = useStorageStore();

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUsage(user.uid);
      return () => unsubscribe();
    }
  }, [user?.uid, subscribeToUsage]);

  if (!user || isLoading) return null;

  const usedBytes = usage.totalBytesUsed;
  const percentage = Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100));
  
  const formattedUsed = bytes(usedBytes, { decimalPlaces: 1, unitSeparator: ' ' });
  const formattedLimit = bytes(limitBytes, { decimalPlaces: 0, unitSeparator: ' ' });

  return (
    <div className="flex flex-col gap-2 p-4 mt-4 bg-muted/20 mx-2 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Cloud className="w-4 h-4 text-muted-foreground" />
          <span>Armazenamento</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {formattedUsed} de {formattedLimit} utilizados
      </p>
    </div>
  );
}
