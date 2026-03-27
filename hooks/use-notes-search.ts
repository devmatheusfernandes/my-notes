import { useMemo, useState } from "react";
import type { Note } from "@/schemas/noteSchema";

export function useNotesSearch(notes: Note[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) => {
      const title = (note.title || "").toLowerCase();
      const content = typeof note.content === "string" ? note.content : "";
      return title.includes(query) || content.toLowerCase().includes(query);
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
