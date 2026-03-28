import { useParams } from "next/navigation";

function getFirstParamValue(value?: string | string[] | null) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function useFolderId() {
  const params = useParams<{ folderId?: string | string[] }>();
  return getFirstParamValue(params?.folderId);
}

export function useNoteId() {
  const params = useParams<{ noteId?: string | string[] }>();
  return getFirstParamValue(params?.noteId);
}

export function useId() {
  const params = useParams<{ id?: string | string[] }>();
  return getFirstParamValue(params?.id);
}
