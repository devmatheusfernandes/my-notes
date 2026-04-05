/**
 * Simple recursive function to extract plain text from Tiptap JSON content.
 * This runs on the server without needing the full Editor instance.
 */
export function extractTextFromTiptap(content: unknown): string {
  if (!content) return "";

  if (typeof content === "string") return content;

  let text = "";

  if (Array.isArray(content)) {
    content.forEach((item) => {
      text += extractTextFromTiptap(item) + " ";
    });
  } else if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    if (obj.content) {
      text += extractTextFromTiptap(obj.content);
    } else if (obj.text) {
      text += String(obj.text);
    }
  }

  return text.trim().replace(/\s+/g, " ");
}
