interface HighlightedTextProps {
  text: string;
  highlight: string;
}

export function HighlightedText({ text, highlight }: HighlightedTextProps) {
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }

  let parts: string[] = [text];
  let regex: RegExp | null = null;

  try {
    regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    parts = text.split(regex);
  } catch {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        regex?.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-500/30 text-foreground rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
