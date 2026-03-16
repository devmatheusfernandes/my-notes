import { cn } from "@/lib/utils";
import { Folder } from "@/schemas/folderSchema";
import { formatDateToLocale } from "@/utils/dates";
import { getBentoClasses } from "@/utils/items";
import { FolderIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FolderCard({
  folder,
  className,
  index = 0,
}: {
  folder: Folder;
  className?: string;
  index?: number;
}) {
  const router = useRouter();

  return (
    <article
      onClick={() => router.push(`/hub/items/${folder.id}`)}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-card p-5 text-foreground transition-all duration-300 hover:bg-muted active:scale-[0.98]",
        getBentoClasses(index),
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="mb-2 text-xs font-bold tracking-wider text-zinc-400 uppercase">
          {formatDateToLocale(folder.createdAt)}
        </div>
        <FolderIcon className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-foreground" />
      </div>

      <h3 className="mb-2 text-base font-bold leading-tight tracking-tight md:text-lg line-clamp-2">
        {folder.title}
      </h3>
      <p className="mt-auto text-xs leading-relaxed text-zinc-500 md:text-sm">
        Abrir pasta
      </p>
    </article>
  );
}
