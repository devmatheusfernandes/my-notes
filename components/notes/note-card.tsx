import { cn } from "@/lib/utils";
import { Note } from "@/schemas/noteSchema";
import { formatDateToLocale } from "@/utils/dates";
import { getBentoClasses, getNotePreview } from "@/utils/notes";
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
        "group flex cursor-pointer flex-col overflow-hidden rounded-[24px] bg-[#F4F4F5] p-5 text-[#2D2D2D] transition-all duration-300 hover:scale-[1.02] hover:bg-[#EAEAEA] hover:shadow-md active:scale-[0.98]",
        getBentoClasses(index),
        className,
      )}
    >
      <div className="mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
        {formatDateToLocale(note.createdAt)}
      </div>
      <h3 className="mb-2 text-base font-bold leading-tight tracking-tight md:text-lg line-clamp-2">
        {note.title || "Sem Título"}
      </h3>
      <p className="mt-auto text-[13px] leading-relaxed text-zinc-500 line-clamp-4 md:text-sm">
        {getNotePreview(note.content || "")}
      </p>
    </article>
  );
}
