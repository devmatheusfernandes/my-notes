"use client";

import React, { useRef, useEffect } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { useRouter } from 'next/navigation';
import { GraphData, GraphNode } from '@/lib/notes/graph-utils';
import { useTheme } from 'next-themes';

interface GraphViewProps {
  data: GraphData;
}

interface InternalNode extends GraphNode {
  x?: number;
  y?: number;
}


const GraphView: React.FC<GraphViewProps> = ({ data }) => {
  const fgRef = useRef<ForceGraphMethods<InternalNode>>(null!);
  const router = useRouter();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  // Obsidian Colors
  const colors = {
    note: isDark ? '#4b5563' : '#9ca3af', // gray-600 / gray-400
    noteActive: '#3b82f6', // blue-500
    tag: isDark ? '#10b981' : '#059669', // emerald-500 / emerald-600
    link: isDark ? '#374151' : '#e5e7eb', // gray-800 / gray-200
    text: isDark ? '#f3f4f6' : '#1f2937', // gray-100 / gray-800
  };

  const handleNodeClick = (node: InternalNode) => {
    const gn = node as GraphNode;
    if (gn.type === 'note') {
      router.push(`/hub/notes/${gn.id}`);
    } else {
       // Filter by tag
       router.push(`/hub/items?tagIds=${gn.id.replace('tag-', '')}`);
    }
  };

  // Center nodes on mount
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 100);
    }
  }, [data]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-background">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeLabel="label"
        nodeColor={(node: InternalNode) => {
          const gn = node as GraphNode;
          return gn.type === 'tag' ? colors.tag : colors.note;
        }}
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkColor={() => colors.link}
        onNodeClick={handleNodeClick}
        nodeCanvasObject={(node: InternalNode, ctx, globalScale) => {
          if (node.x === undefined || node.y === undefined) return;
          const label = node.label;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Inter, sans-serif`;
          // const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding (unused)

          // Draw node circle
          const gn = node as GraphNode;
          ctx.fillStyle = gn.type === 'tag' ? colors.tag : colors.note;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4 / globalScale + (gn.type === 'note' ? 2 : 1), 0, 2 * Math.PI, false);
          ctx.fill();

          // Only show labels when zoomed in enough or for tags
          if (globalScale > 1.5 || gn.type === 'tag') {
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = colors.text;
              ctx.fillText(label, node.x, node.y + (8 / globalScale));
          }
        }}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 100)}
      />
    </div>
  );
};

export default GraphView;
