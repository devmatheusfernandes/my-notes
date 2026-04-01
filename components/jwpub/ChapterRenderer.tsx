"use client";

import { useMemo, useEffect, useRef } from "react";

interface ChapterRendererProps {
  html: string;
  images: Record<string, string>;
  footnotes: Record<string, string>;
  onReferenceClick: (ref: { label: string; url: string }) => void;
  skipImageId?: string;
}

export function ChapterRenderer({
  html,
  images,
  footnotes,
  onReferenceClick,
  skipImageId
}: ChapterRendererProps) {
  const processedHtml = useMemo(() => {
    if (!html) return "";

    let result = html;

    // Remove skipped image if present
    if (skipImageId) {
      const escapedSkipId = skipImageId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Match jwpub-media://ID or just the filename in a src attribute
      const jwMediaRegex = new RegExp(
        `<img[^>]*src=["']jwpub-media://${escapedSkipId}["'][^>]*>`,
        "gi"
      );
      const directRegex = new RegExp(
        `<img[^>]*src=["'][^"']*${escapedSkipId}["'][^>]*>`,
        "gi"
      );
      
      result = result.replace(jwMediaRegex, "").replace(directRegex, "");
    }

    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    result = result.replace(/jwpub-media:\/\/([^\s"'<>]+)/g, (match, id) => {
      return images[id] || placeholder;
    });

    Object.entries(images).forEach(([id, blobUrl]) => {
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const srcRegex = new RegExp(`src\\s*=\\s*["']?\\s*${escapedId}\\s*["']?`, 'g');
      result = result.replace(srcRegex, `src="${blobUrl}"`);
    });

    return result;
  }, [html, images, skipImageId]);

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
      } else if (href.startsWith('jwpub://b/')) {
        e.preventDefault();
        onReferenceClick({
          label: link.textContent || "Referência Bíblica",
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
