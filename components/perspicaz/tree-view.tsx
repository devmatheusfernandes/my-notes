"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Panel,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Position,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { GenealogyNode, GenealogyLink } from "@/utils/transformData";
import { LayoutGrid, ArrowDown, ArrowRight, Maximize2 } from "lucide-react";

// Custom Node Component
const GenealogyNodeComponent = ({ data, targetPosition, sourcePosition }: { 
  data: GenealogyNode; 
  targetPosition?: Position; 
  sourcePosition?: Position; 
}) => {
  return (
    <div
      className="px-4 py-3 shadow-2xl rounded-2xl border-2 bg-black/70 backdrop-blur-2xl text-white min-w-[180px] transition-all hover:scale-105 hover:bg-black/90 group relative"
      style={{ borderColor: data.color || "#A9A9A9" }}
    >
      {/* Entrada (Pai) */}
      <Handle 
        type="target" 
        position={targetPosition || Position.Top} 
        className="!bg-white/20 !border-white/10 !w-2 !h-2" 
      />
      
      <div className="flex items-center justify-between mb-1.5">
        <div className="font-bold text-sm tracking-tight truncate max-w-[140px]">{data.label}</div>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color || "#A9A9A9" }} />
      </div>

      {data.tags && (data.tags as string[]).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {(data.tags as string[]).map(tag => (
            <span key={tag} className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-white/5 rounded-md border border-white/5 opacity-70">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {data.notes && (
        <div className="text-[10px] mt-2 text-white/50 leading-relaxed font-light line-clamp-2 group-hover:line-clamp-none transition-all">
          {(data.notes as string)}
        </div>
      )}
      
      {data.refs && (
        <div className="text-[8px] mt-2 italic text-white/30 font-serif border-t border-white/5 pt-1.5">
          {(data.refs as string)}
        </div>
      )}

      {/* Saída (Filho) */}
      <Handle 
        type="source" 
        position={sourcePosition || Position.Bottom} 
        className="!bg-white/20 !border-white/10 !w-2 !h-2" 
      />
    </div>
  );
};

const nodeTypes = {
  genealogyNode: GenealogyNodeComponent,
};

interface TreeViewProps {
  data: {
    nodes: GenealogyNode[];
    links: GenealogyLink[];
  };
}

const getLayoutedElements = (nodes: Node<GenealogyNode>[], edges: Edge[], direction: "TB" | "LR" = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 220;
  const nodeHeight = 120;
  const isHorizontal = direction === "LR";
  
  dagreGraph.setGraph({ 
    rankdir: direction, 
    ranksep: 140, 
    nodesep: 100,
    marginx: 80,
    marginy: 80,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    const isSpouse = edge.data?.type === "spouse" || edge.data?.type === "father_in_law";
    if (!isSpouse) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const TreeViewContent: React.FC<TreeViewProps> = ({ data }) => {
  const [direction, setDirection] = React.useState<"TB" | "LR">("TB");
  const { fitView } = useReactFlow();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!data || !data.nodes) return { nodes: [], edges: [] };

    const rfNodes: Node<GenealogyNode>[] = data.nodes.map((node) => ({
      id: node.id,
      type: "genealogyNode",
      data: node,
      position: { x: 0, y: 0 },
    }));

    const rfEdges: Edge[] = data.links.map((link, index) => {
      const isSpouse = link.type === "spouse" || link.type === "father_in_law";
      const isAdoptive = link.type === "adoptive_parent" || link.type === "legal_parent";
      
      return {
        id: `e-${link.source}-${link.target}-${index}`,
        source: link.source,
        target: link.target,
        type: isSpouse ? "step" : "smoothstep",
        data: { type: link.type },
        animated: isAdoptive,
        style: isSpouse
          ? { stroke: "rgba(255, 255, 255, 0.4)", strokeDasharray: "6,6", strokeWidth: 1.5 }
          : { stroke: "rgba(255, 255, 255, 0.25)", strokeWidth: 2 },
        markerEnd: isSpouse ? undefined : {
          type: MarkerType.ArrowClosed,
          color: "rgba(255, 255, 255, 0.3)",
        },
      };
    });

    return getLayoutedElements(rfNodes, rfEdges, direction);
  }, [data, direction]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
  }, [direction, initialNodes, initialEdges, setNodes, setEdges, fitView]);

  return (
    <div className="w-full h-full border border-white/5 rounded-3xl overflow-hidden bg-[#050505] relative shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        minZoom={0.02}
        maxZoom={1.5}
      >
        <Background 
          color="#151515" 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={0.5} 
          className="opacity-50"
        />
        
        <Controls className="!bg-black/60 !border-white/10 !fill-white !rounded-xl !overflow-hidden !m-6 !shadow-2xl backdrop-blur-md" />
        
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          nodeColor={(n: Node<GenealogyNode>) => (n.data?.color as string) || "#A9A9A9"}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="!rounded-2xl !border-white/10 !bg-black/40 !backdrop-blur-xl !m-6 !shadow-2xl"
          style={{ height: 140, width: 220 }}
        />
        
        <Panel position="top-left" className="m-6 space-y-3">
           <div className="bg-black/80 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-3xl shadow-2xl">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                 <LayoutGrid className="w-4 h-4 text-white/80" />
               </div>
               <div className="flex flex-col">
                 <h3 className="text-white font-bold text-sm tracking-tight">Árvore Genealógica</h3>
                 <p className="text-[10px] text-white/40 font-medium">Layout Hierárquico Dinâmico</p>
               </div>
             </div>
           </div>

           <div className="flex gap-2">
             <button
                onClick={() => setDirection("TB")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-medium shadow-xl backdrop-blur-md ${
                  direction === "TB" 
                  ? "bg-white text-black border-white" 
                  : "bg-black/60 text-white/60 border-white/10 hover:bg-black/80 hover:text-white"
                }`}
             >
               <ArrowDown className="w-3.5 h-3.5" />
               Vertical
             </button>
             <button
                onClick={() => setDirection("LR")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-medium shadow-xl backdrop-blur-md ${
                  direction === "LR" 
                  ? "bg-white text-black border-white" 
                  : "bg-black/60 text-white/60 border-white/10 hover:bg-black/80 hover:text-white"
                }`}
             >
               <ArrowRight className="w-3.5 h-3.5" />
               Horizontal
             </button>
           </div>
        </Panel>

        <Panel position="bottom-left" className="m-6">
           <button 
             onClick={() => fitView({ padding: 0.2, duration: 400 })}
             className="p-3 bg-black/60 hover:bg-black/80 text-white/80 rounded-xl border border-white/10 backdrop-blur-md transition-all shadow-xl"
             title="Resetar Zoom"
           >
             <Maximize2 className="w-4 h-4" />
           </button>
        </Panel>
      </ReactFlow>
      
      <style jsx global>{`
        .react-flow__handle {
          opacity: 0;
          pointer-events: none;
        }
        .react-flow__controls-button {
          background-color: transparent !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          transition: background-color 0.2s;
        }
        .react-flow__controls-button:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .react-flow__controls-button svg {
          fill: white !important;
        }
        .react-flow__attribution {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default function TreeView(props: TreeViewProps) {
  return (
    <ReactFlowProvider>
      <TreeViewContent {...props} />
    </ReactFlowProvider>
  );
}