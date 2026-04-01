"use client";

import React, { useRef } from "react";
import { useJwpub } from "@/hooks/use-jwpub";
import { Upload, FileText, Loader2, Link2, X } from "lucide-react";

export function JwpubUploader() {
  const { uploadJwpub, isProcessing, symbols, deletePublication } = useJwpub();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".jwpub")) {
      alert("Por favor, selecione um arquivo .jwpub válido.");
      return;
    }

    try {
      await uploadJwpub(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Biblioteca JWPUB
        </h3>
        <span className="text-xs text-zinc-500 uppercase tracking-tighter font-medium">Local Store</span>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer bg-zinc-50 dark:bg-zinc-800/20 hover:border-blue-400 dark:hover:border-blue-700 ${isProcessing ? 'opacity-50 pointer-events-none' : 'border-zinc-200 dark:border-zinc-800'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jwpub"
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm font-medium animate-pulse">Processando arquivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Clique para importar .jwpub</p>
              <p className="text-xs text-zinc-500">O arquivo será convertido em JSON localmente</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
