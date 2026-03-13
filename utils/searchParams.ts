import { useParams } from "next/navigation";

export function useFolderId() {
  const params = useParams<{ folderId?: string | string[] }>();
  const folderId = params?.folderId;

  if (!folderId) return null;
  if (Array.isArray(folderId)) return folderId[0] ?? null;
  return folderId;
}

export function useNoteId() {
  const params = useParams<{ noteId?: string | string[] }>();
  const noteId = params?.noteId;

  if (!noteId) return null;
  if (Array.isArray(noteId)) return noteId[0] ?? null;
  return noteId;
}
