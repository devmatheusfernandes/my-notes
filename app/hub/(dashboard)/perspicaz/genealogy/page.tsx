"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LayoutGrid, Network, Info } from "lucide-react";
import { GenealogyNode, GenealogyLink } from "@/utils/transformData";
import genealogyDataRaw from "@/data/genealogy/genealogy.json";

const genealogyData = genealogyDataRaw as {
  nodes: GenealogyNode[];
  links: GenealogyLink[];
};

const GenealogyGraphView = dynamic(() => import("@/components/perspicaz/genealogy-graph-view"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white/5 animate-pulse rounded-xl" />,
});

const TreeView = dynamic(() => import("@/components/perspicaz/tree-view"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white/5 animate-pulse rounded-xl" />,
});

export default function GenealogiaPage() {
  const [viewMode, setViewMode] = useState<"graph" | "tree">("tree");

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-white/90 p-4 md:p-6 flex flex-col gap-4 font-[Outfit,sans-serif] overflow-hidden">

      <header className="flex justify-center md:justify-end">
        <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setViewMode("graph")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm ${viewMode === "graph"
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/40 hover:text-white/80"
              }`}
          >
            <Network className="w-4 h-4" />
            Grafo
          </button>
          <button
            onClick={() => setViewMode("tree")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm ${viewMode === "tree"
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/40 hover:text-white/80"
              }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Árvore
          </button>
        </div>
      </header>
      <main className="flex-1 w-full relative rounded-xl border border-white/5 bg-black/40 overflow-hidden shadow-2xl">
        {viewMode === "graph" ? (
          <GenealogyGraphView data={genealogyData} />
        ) : (
          <TreeView data={genealogyData} />
        )}
      </main>

      <footer className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40 px-2 pb-2">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4682B4]" /> Patriarcas
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#8B0000]" /> Reis (Judá)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FFD700]" /> Messias
          </div>
        </div>

        <p className="flex items-center gap-1.5 opacity-80">
          <Info className="w-3.5 h-3.5" />
          Árvore agrupa cônjuges. Grafo exibe relações completas.
        </p>
      </footer>
    </div>
  );
}