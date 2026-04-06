import { useMemo, useState } from "react";
import type { Note } from "@/schemas/noteSchema";
import { normalizeText } from "@/lib/utils/tokenizer";

export function useNotesSearch(notes: Note[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return notes;

    const query = normalizeText(rawQuery);

    return notes.filter((note) => {
      // 1. Favor processed tokens (fast & robust)
      if (note.searchTokens) {
        return note.searchTokens.includes(query);
      }

      // 2. Fallback for notes not yet processed by Cron
      const title = normalizeText(note.title || "");
      const searchText = normalizeText(note.searchText || "");
      return title.includes(query) || searchText.includes(query);
    });
  }, [notes, searchQuery]);

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [filteredNotes]);

  return {
    searchQuery,
    setSearchQuery,
    filteredNotes,
    sortedNotes,
  };
}
