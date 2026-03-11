import { cn } from "@/lib/utils";

//TODO: Depois precisamos trocar pelas tags
const CATEGORIES = ["All", "Quick notes", "To-do list", "Journal"] as const;

export default function CategoryChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="flex w-full items-center justify-start gap-2 overflow-x-auto rounded-full bg-transparent pb-2 [&::-webkit-scrollbar]:hidden md:bg-[#F4F4F5] md:p-1.5 md:pb-1.5">
      {CATEGORIES.map((category) => {
        const active = category === value;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all duration-200",
              active
                ? "bg-[#2D2D2D] text-white shadow-sm"
                : "bg-[#F4F4F5] text-zinc-500 hover:bg-[#EAEAEA] hover:text-[#2D2D2D] md:bg-transparent",
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
