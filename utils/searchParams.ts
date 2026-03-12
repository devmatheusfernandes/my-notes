import { useParams } from "next/navigation";

export function useFolderId() {
  const params = useParams<{ folderId?: string | string[] }>();
  const folderId = params?.folderId;

  if (!folderId) return null;
  if (Array.isArray(folderId)) return folderId[0] ?? null;
  return folderId;
}
