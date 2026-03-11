import { Content } from "@tiptap/react";

export function getNotePreview(content: Content) {
  if (!content) return "Nota vazia...";
  if (typeof content === "string") return content.substring(0, 60) + "...";
  return "Abra para ver o conteúdo...";
}

export function getBentoClasses(index: number) {
  const pattern = index % 6;
  switch (pattern) {
    case 0:
      return "col-span-2 row-span-2 md:col-span-2 md:row-span-2";
    case 1:
      return "col-span-1 row-span-1 md:col-span-1 md:row-span-1";
    case 2:
      return "col-span-1 row-span-2 md:col-span-1 md:row-span-2";
    case 3:
      return "col-span-2 row-span-1 md:col-span-1 md:row-span-1";
    case 4:
      return "col-span-1 row-span-1 md:col-span-2 md:row-span-1";
    case 5:
      return "col-span-1 row-span-1 md:col-span-1 md:row-span-1";
    default:
      return "col-span-1 row-span-1";
  }
}
