import type { Folder } from "@/schemas/folderSchema";
import type { Note } from "@/schemas/noteSchema";


export function getBentoClasses(index: number) {
  const p = index % 10;
  if (p === 0 || p === 6) {
    return "col-span-2 row-span-2 md:col-span-2 md:row-span-2";
  }
  if (p === 2 || p === 8) {
    return "col-span-1 row-span-2 md:col-span-1 md:row-span-2";
  }
  return "col-span-1 row-span-1 md:col-span-1 md:row-span-1";
}

export function getFolderBentoClasses() {
  return "col-span-1 row-span-1 md:col-span-1 md:row-span-1";
}

export function getCreatedAtTime(createdAt?: string) {
  if (!createdAt) return 0;
  const date = new Date(createdAt);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

export function sortByCreatedAtDesc<T extends { createdAt?: string }>(
  items: T[],
) {
  return [...items].sort(
    (a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt),
  );
}

export function filterNotesByFolder(notes: Note[], folderId: string | null) {
  if (!folderId) return notes;
  return notes.filter((note) => note.folderId === folderId);
}

export function filterFoldersByParent(
  folders: Folder[],
  folderId: string | null,
) {
  if (!folderId) return folders.filter((folder) => !folder.parentId);
  return folders.filter((folder) => folder.parentId === folderId);
}

export type NotesGridItem =
  | { kind: "note"; note: Note; createdAt?: string }
  | { kind: "folder"; folder: Folder; createdAt?: string };

export function buildNotesGridItems({
  notes,
  folders,
  folderId,
}: {
  notes: Note[];
  folders: Folder[];
  folderId: string | null;
}) {
  const noteItems: NotesGridItem[] = notes.map((note) => ({
    kind: "note",
    note,
    createdAt: note.createdAt,
  }));
  const folderItems: NotesGridItem[] = filterFoldersByParent(
    folders,
    folderId,
  ).map((folder) => ({
    kind: "folder",
    folder,
    createdAt: folder.createdAt,
  }));

  return sortByCreatedAtDesc([...folderItems, ...noteItems]);
}
