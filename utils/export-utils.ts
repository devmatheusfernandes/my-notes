import { Content, JSONContent } from "@tiptap/react";
import { generateText } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Typography } from "@tiptap/extension-typography";

const extensions = [
  StarterKit,
  TaskList,
  TaskItem,
  Highlight,
  Subscript,
  Superscript,
  Typography,
];

/**
 * Converts Tiptap JSON content to plain text.
 */
export function tiptapToText(content: Content | null | undefined): string {
  if (!content) return "";
  
  if (typeof content === "string") {
    // If it's HTML, we could use a simple strip tags or just return as is
    // For now, let's assume it's plain text if it's a string, 
    // or strip HTML tags if it looks like HTML.
    return content.replace(/<[^>]*>?/gm, '');
  }

  try {
    return generateText(content as JSONContent, extensions);
  } catch (error) {
    console.error("Error generating text from Tiptap JSON:", error);
    return "";
  }
}

/**
 * Triggers a browser download of a file.
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Shares a file using the Web Share API.
 */
export async function shareFile(content: string, filename: string, title?: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const file = new File([blob], filename, { type: "text/plain" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title || filename,
        text: "Compartilhando nota do MyNotes",
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing file:", error);
      }
      return false;
    }
  } else {
    // Fallback: Copy to clipboard or download?
    // Let's try to just share the text if files are not supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || filename,
          text: content,
        });
        return true;
      } catch (error) {
        console.error("Error sharing text:", error);
        return false;
      }
    }
    return false;
  }
}
