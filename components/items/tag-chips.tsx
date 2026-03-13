import { useTags } from "@/hooks/use-tags";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function TagChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (tag: string) => void;
}) {
    const userId = "user_teste_123";
    const { fetchTags, tags } = useTags();
    useEffect(() => {
      fetchTags(userId);
    }, [fetchTags, userId]);

  return (
    <div className="flex w-full items-center justify-start gap-1.5 overflow-x-auto bg-transparent px-2 pb-2 [&::-webkit-scrollbar]:hidden md:p-1.5 md:pb-1.5">
      {tags.map((tag) => {
        const active = tag.title === value;
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onChange(tag.title)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200",
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-accent-foreground",
            )}
          >
            {tag.title}
          </button>
        );
      })}
    </div>
  );
}
