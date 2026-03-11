import { Loader2, Plus } from "lucide-react";
import { Button } from "../ui/button";

export default function CreateNoteButton({
  isLoading,
  handleCreateNewNote,
}: {
  isLoading: boolean;
  handleCreateNewNote: () => Promise<void>;
}) {
  return (
    <Button
      onClick={handleCreateNewNote}
      disabled={isLoading}
      aria-label="Create note"
      variant="default"
      className="rounded-full w-16 h-16 md:w-20 md:h-20"
    >
      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-white md:size-8" />
      ) : (
        <Plus className="size-7 md:size-9" strokeWidth={2.5} />
      )}
    </Button>
  );
}
