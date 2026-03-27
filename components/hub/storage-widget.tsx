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
          <Cloud className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-semibold text-foreground">
            Armazenamento
          </span>
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="mt-2 text-sm text-muted-foreground">
        {formattedUsed} de {formattedLimit} utilizados
      </p>
    </div>
  );
}
