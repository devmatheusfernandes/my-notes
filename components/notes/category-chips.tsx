import { cn } from "@/lib/utils";

//TODO: Depois precisamos trocar pelas tags
const CATEGORIES = [
  "All",
  "Quick notes",
  "To-do list",
  "Journal",
  "Tags",
  "Random",
] as const;

export default function CategoryChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="flex w-full items-center justify-start gap-1.5 overflow-x-auto bg-transparent px-2 pb-2 [&::-webkit-scrollbar]:hidden md:p-1.5 md:pb-1.5">
      {CATEGORIES.map((category) => {
        const active = category === value;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200",
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-accent-foreground",
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
