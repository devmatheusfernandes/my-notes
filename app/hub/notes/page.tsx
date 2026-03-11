"use client";

import { useEffect, useMemo } from "react";
import { useNotes } from "@/hooks/use-notes";
import BentoGrid from "@/components/notes/bento-grid";
import NoteCard from "@/components/notes/note-card";
import { useNotesSearch } from "@/hooks/use-notes-search";

export default function NotesPage() {
  const { fetchNotes, notes } = useNotes();
  const { sortedNotes } = useNotesSearch(notes);
  const gridNotes = useMemo(() => sortedNotes.slice(2), [sortedNotes]);
  const userId = "user_teste_123";

  useEffect(() => {
    fetchNotes(userId);
  }, [fetchNotes, userId]);

  return (
    <main>
      <BentoGrid>
        {gridNotes.map((note, index) => (
          <NoteCard key={note.id} note={note} index={index} />
        ))}
      </BentoGrid>
    </main>
  );
}
