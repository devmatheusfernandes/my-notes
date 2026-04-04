"use client";

import { useMemo, useEffect, useRef } from "react";
import { transformDocIdLinks } from "@/lib/jwpub/jwpub-utils";

interface ChapterRendererProps {
  html: string;
  images: Record<string, string>;
  footnotes: Record<string, string>;
  onReferenceClick: (ref: { label: string; url: string }) => void;
  skipImageId?: string;
  highlightTerm?: string;
}

export function ChapterRenderer({
  html,
  images,
  footnotes,
  onReferenceClick,
  skipImageId,
  highlightTerm
}: ChapterRendererProps) {
  const processedHtml = useMemo(() => {
    if (!html) return "";

    let result = html;

    // 1. Remove skipped image if present
    if (skipImageId) {
      const escapedSkipId = skipImageId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const jwMediaRegex = new RegExp(`<img[^>]*src=["']jwpub-media://${escapedSkipId}["'][^>]*>`, "gi");
      const directRegex = new RegExp(`<img[^>]*src=["'][^"']*${escapedSkipId}["'][^>]*>`, "gi");
      result = result.replace(jwMediaRegex, "").replace(directRegex, "");
    }

    // 2. Handle jwpub images
    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    result = result.replace(/jwpub-media:\/\/([^\s"'<>]+)/g, (match, id) => images[id] || placeholder);

    Object.entries(images).forEach(([id, blobUrl]) => {
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const srcRegex = new RegExp(`src\\s*=\\s*["']?\\s*${escapedId}\\s*["']?`, 'g');
      result = result.replace(srcRegex, `src="${blobUrl}"`);
    });

    // 3. Transform JWPub DocId links
    result = transformDocIdLinks(result);

    // 4. Implement Highlighting (New)
    if (highlightTerm?.trim()) {
      // Simple regex to identify parsed terms (same logic as search)
      const termRegex = /(['"])(.*?)\1|(\S+)/g;
      const cleanQuery = highlightTerm.replace(/[,\.]/g, " ");
      const terms: string[] = [];
      let match;
      while ((match = termRegex.exec(cleanQuery)) !== null) {
        const t = (match[2] || match[3] || "").trim();
        if (t.length > 1) terms.push(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      }

      if (terms.length > 0) {
        // We want to highlight only text, not inside HTML tags
        // Regex: (terms)|(<[^>]+>) - if group 1 matches, it's our term.
        const highlightPattern = new RegExp(`(${terms.join("|")})|(<[^>]+>)`, "gi");
        result = result.replace(highlightPattern, (m, g1) => {
          if (g1) return `<mark class="bg-yellow-400/30 dark:bg-yellow-500/50 rounded-sm px-0.5 ring-1 ring-yellow-400/20 text-foreground search-highlight">${m}</mark>`;
          return m; // Keep tags as they are
        });
      }
    }

    return result;
  }, [html, images, skipImageId, highlightTerm]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('jwpub://f/')) {
        e.preventDefault();
        const fId = href.split('/').pop();
        if (fId && footnotes[fId]) {
          onReferenceClick({
            label: `Nota de Rodapé`,
            url: footnotes[fId]
          });
        }
      } else if (href.startsWith('jwpub://b/') || href.startsWith('jwpub://p/')) {
        e.preventDefault();
        onReferenceClick({
          label: link.textContent || "Referência",
          url: href
        });
      } else if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetEl = node.querySelector(`[id="${targetId}"], [name="${targetId}"]`);

        if (targetEl) {
          window.history.replaceState(null, '', `${window.location.pathname}#${targetId}`);

          onReferenceClick({
            label: `Nota: ${link.textContent}`,
            url: targetEl.innerHTML
          });
        }
      }
    };

    node.addEventListener('click', handleLinkClick);
    return () => node.removeEventListener('click', handleLinkClick);
  }, [footnotes, onReferenceClick]);

  return (
    <div
      ref={containerRef}
      className="jwpub-content"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
