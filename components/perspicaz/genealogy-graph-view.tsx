"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { GenealogyNode, GenealogyLink } from "@/utils/transformData";

interface GraphNode extends GenealogyNode {
  x?: number;
  y?: number;
  __bckgDimensions?: [number, number] | null;
}

interface GraphViewProps {
  data: {
    nodes: GenealogyNode[];
    links: GenealogyLink[];
  };
}

const GenealogyGraphView: React.FC<GraphViewProps> = ({ data }) => {
  const fgRef = useRef<ForceGraphMethods>(null!);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Pega o tamanho real do container para o Canvas não distorcer
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Ajusta o zoom inicial suavemente quando o gráfico e o tamanho carregam
  useEffect(() => {
    if (fgRef.current && dimensions.width > 0) {
      setTimeout(() => {
        fgRef.current.zoomToFit(500, 50); // 500ms de animação, 50px de margem
      }, 100);
    }
  }, [data, dimensions.width]);

  // Função de renderização customizada dos nós
  const drawNode = useCallback((nodeRaw: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const node = nodeRaw as GraphNode;
    const label = node.label;
    const fontSize = 12 / globalScale;

    // 1. Desenhar o círculo do nó (Sempre visível)
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || "#A9A9A9";
    ctx.fill();

    // 2. Lógica Minimalista: Só desenha o texto se o zoom estiver próximo o suficiente (> 0.8)
    if (globalScale >= 0.8) {
      ctx.font = `${fontSize}px "Outfit", sans-serif`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions: [number, number] = [textWidth + fontSize * 0.4, fontSize + fontSize * 0.4];

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Fundo escuro sutil para melhorar a leitura sobre as linhas
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      
      if (ctx.roundRect) {
        ctx.roundRect(
          node.x! - bckgDimensions[0] / 2,
          node.y! - bckgDimensions[1] / 2 + 10,
          bckgDimensions[0],
          bckgDimensions[1],
          2 // Borda arredondada
        );
      } else {
        ctx.fillRect( // Fallback caso roundRect não seja suportado em browsers antigos
          node.x! - bckgDimensions[0] / 2,
          node.y! - bckgDimensions[1] / 2 + 10,
          bckgDimensions[0],
          bckgDimensions[1]
        );
      }
      ctx.fill();

      // Cor do texto
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText(label, node.x!, node.y! + 10);

      // Salva a dimensão da hitbox para o mouse funcionar no texto
      node.__bckgDimensions = bckgDimensions;
    } else {
      node.__bckgDimensions = null;
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing">
      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={data}
          nodeLabel={(nodeRaw: object) => (nodeRaw as GraphNode).label} // Tooltip nativo (aparece no hover)
          nodeColor={(nodeRaw: object) => (nodeRaw as GraphNode).color || "#A9A9A9"}
          linkColor={() => "rgba(255, 255, 255, 0.15)"}
          linkWidth={1}
          linkDirectionalArrowLength={2.5}
          linkDirectionalArrowRelPos={1}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={(nodeRaw, color, ctx, globalScale) => {
            const node = nodeRaw as GraphNode;
            // Garante que o hover funcione tanto no círculo quanto no texto (se visível)
            ctx.fillStyle = color;
            const bckgDimensions = node.__bckgDimensions;

            ctx.beginPath();
            ctx.arc(node.x!, node.y!, 5, 0, 2 * Math.PI, false);
            ctx.fill();

            if (bckgDimensions && globalScale >= 0.8) {
              ctx.fillRect(
                node.x! - bckgDimensions[0] / 2,
                node.y! - bckgDimensions[1] / 2 + 10,
                bckgDimensions[0],
                bckgDimensions[1]
              );
            }
          }}
          d3AlphaDecay={0.02} // Movimento mais fluido e duradouro ao assentar
          d3VelocityDecay={0.3}
          cooldownTicks={150}
        />
      )}

      {/* Caixa de instruções padronizada */}
      <div className="absolute top-4 right-4 text-xs text-white/50 pointer-events-none bg-black/40 px-3 py-2 rounded-lg border border-white/5 backdrop-blur-md">
        <p>• Arraste para mover</p>
        <p>• Scroll para zoom</p>
      </div>
    </div>
  );
};

export default GenealogyGraphView;