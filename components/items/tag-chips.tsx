import { cn } from "@/lib/utils";
import type { Tag } from "@/schemas/tagSchema";

export default function TagChips({
  tags,
  value,
  onChange,
}: {
  tags: Tag[];
  value: string | null;
  onChange: (tagId: string | null) => void;
}) {
  return (
    <div className="flex w-full items-center justify-start gap-1.5 overflow-x-auto bg-transparent pb-2 [&::-webkit-scrollbar]:hidden md:p-1.5 md:pb-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200",
          "inline-flex items-center gap-2",
          value === null
            ? "bg-primary text-white shadow-sm"
            : "bg-muted text-accent-foreground",
        )}
      >
        <span className={cn("size-2 rounded-full", "bg-muted-foreground/40")} />
        Todas
      </button>
      {tags.map((tag) => {
        const active = tag.id === value;
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onChange(tag.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200",
              "inline-flex items-center gap-2",
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-accent-foreground",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                tag.color ?? "bg-muted-foreground/40",
              )}
            />
            {tag.title}
          </button>
        );
      })}
    </div>
  );
}
