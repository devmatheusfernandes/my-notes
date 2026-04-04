"use client";

import { normalizeTerm } from "@/lib/video/tokenize";
import { escapeRegExp } from "@/lib/search/search-utils";
import Link from "next/link";

interface HighlightedSnippetProps {
  text?: string;
  term: string;
  symbol: string;
  chapterIndex?: number;
  paragraphIndex?: number;
  asDiv?: boolean;
}

export function HighlightedSnippet({
  text,
  term,
  symbol,
  chapterIndex = 0,
  asDiv = false
}: HighlightedSnippetProps) {
  if (!text) return null;
  const regex = /(['"])(.*?)\1|(\S+)/g;
  const cleanQuery = term.replace(/[,\.]/g, " ");
  const parsedTerms: { term: string; exact: boolean }[] = [];
  let match;
  while ((match = regex.exec(cleanQuery)) !== null) {
    if (match[2] && match[2].trim()) {
      parsedTerms.push({ term: match[2].trim(), exact: true });
    } else if (match[3] && match[3].trim()) {
      parsedTerms.push({ term: match[3].trim(), exact: false });
    }
  }

  const normText = normalizeTerm(text);
  let index = -1;

  for (const t of parsedTerms) {
    const normT = normalizeTerm(t.term);
    if (t.exact) {
      try {
        const r = new RegExp(`\\b${escapeRegExp(normT)}\\b`, "i");
        const m = r.exec(normText);
        if (m) {
          index = m.index;
          break;
        }
      } catch { }
    } else {
      const idx = normText.indexOf(normT);
      if (idx !== -1) {
        index = idx;
        break;
      }
    }
  }

  const href = `/hub/personal-study/${symbol}?c=${chapterIndex}${term ? `&h=${encodeURIComponent(term)}` : ""}`;

  const renderContent = (content: React.ReactNode, className?: string) => {
    if (asDiv) return <div className={className}>{content}</div>;
    return <Link href={href} className={className}>{content}</Link>;
  };

  if (index === -1) {
    return renderContent(
      <span className="text-muted-foreground text-xs line-clamp-2 bg-muted/30 p-2 rounded-lg border border-border/40 italic">
        {text.slice(0, 100)}...
      </span>,
      "block"
    )
  }

  const totalTermsLength = parsedTerms.reduce((acc, t) => acc + t.term.length, 0);
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + totalTermsLength + 60);

  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";

  const originalSnippet = text.slice(start, end);

  const partsRegex = parsedTerms
    .map((t) => {
      const esc = escapeRegExp(t.term);
      if (t.exact) return `\\b${esc}\\b`;
      return esc;
    })
    .join("|");

  const splitRegex = new RegExp(`(${partsRegex})`, "gi");
  const parts = originalSnippet.split(splitRegex);

  return renderContent(
    <div className="h-full text-muted-foreground group-hover:text-foreground transition-colors text-xs leading-relaxed line-clamp-2 bg-muted/60 dark:bg-muted/30 p-2 rounded-sm border border-border/40 italic relative overflow-hidden">
      <div className="relative z-10">
        {prefix}
        {parts.map((part, i) => {
          const normPart = normalizeTerm(part);
          const isMatch = parsedTerms.some((t) => {
            const normT = normalizeTerm(t.term);
            if (t.exact) {
              return new RegExp(`^${escapeRegExp(normT)}$`, "i").test(normPart);
            }
            return new RegExp(escapeRegExp(normT), "i").test(normPart);
          });

          if (isMatch) {
            return (
              <span
                key={i}
                className="bg-yellow-100 dark:bg-yellow-500/80 text-yellow-900 dark:text-white font-bold px-0.5 rounded ring-1 ring-yellow-400/30"
              >
                {part}
              </span>
            );
          }
          return part;
        })}
        {suffix}
      </div>
    </div>,
    "block group"
  );
}
