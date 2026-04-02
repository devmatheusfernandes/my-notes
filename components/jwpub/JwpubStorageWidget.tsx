"use client";

import React, { useEffect, useState } from "react";
import { HardDrive, RefreshCw, BookText, FileImage } from "lucide-react";
import { indexedDbService } from "@/services/indexedDbService";
import bytes from "bytes";
import { motion } from "framer-motion";
import { itemFadeInUpVariants } from "@/lib/animations";

export function JwpubStorageWidget() {
  const [data, setData] = useState<{ totalBytes: number; pubCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await indexedDbService.getStorageUsage();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch storage usage:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  if (loading && !data) {
    return (
      <div className="card-section animate-pulse h-32 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
      </div>
    );
  }

  const formattedSize = bytes(data?.totalBytes || 0, {
    decimalPlaces: 1,
    unitSeparator: " ",
  });

  return (
    <motion.section variants={itemFadeInUpVariants} className="card-section">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="card-title flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            Biblioteca Local (Offline)
          </h2>
          <p className="card-description">
            Armazenamento ocupado pelas publicações importadas no seu navegador.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-500 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <BookText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400">Publicações</p>
            <p className="text-xl font-bold leading-tight">{data?.pubCount} Itens</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileImage className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400">Tamanho em Disco</p>
            <p className="text-xl font-bold leading-tight text-blue-600 dark:text-blue-400">{formattedSize}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
