"use client";

import { useEffect } from "react";
import { useNotes } from "@/hooks/use-notes";

export default function NotesPage() {
  const { fetchNotes } = useNotes();
  const mockUserId = "user_teste_123";

  useEffect(() => {
    fetchNotes(mockUserId);
  }, [fetchNotes]);

  return (
    <div className="min-h-screen bg-background">
      <p>Notes</p>
    </div>
  );
}
