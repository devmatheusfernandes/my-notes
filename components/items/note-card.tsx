import { cn } from "@/lib/utils";
import { Note } from "@/schemas/noteSchema";
import { formatDateToLocale } from "@/utils/dates";
import { getBentoClasses, getNotePreview } from "@/utils/items";
import { useRouter } from "next/navigation";

export default function NoteCard({
  note,
  className,
  index = 0,
}: {
  note: Note;
  className?: string;
  index?: number;
}) {
  const router = useRouter();

  return (
    <article
      onClick={() => router.push(`/hub/notes/${note.id}`)}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-card p-5 text-foreground transition-all duration-300 hover:bg-muted active:scale-[0.98]",
        getBentoClasses(index),
        className,
      )}
    >
      <div className="mb-2 text-xs font-bold tracking-wider text-zinc-400 uppercase">
        {formatDateToLocale(note.createdAt)}
      </div>
      <h3 className="mb-2 text-base font-bold leading-tight tracking-tight md:text-lg line-clamp-2">
        {note.title || "Sem Título"}
      </h3>
      <p className="mt-auto text-xs leading-relaxed text-zinc-500 line-clamp-4 md:text-sm">
        {getNotePreview(note.content || "")}
      </p>
    </article>
  );
}
