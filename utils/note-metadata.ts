import { Note } from "@/schemas/noteSchema";
import type { JSONContent } from "@tiptap/core";
import type { Content } from "@tiptap/react";

export interface TaskItem {
  label: string;
  checked: boolean;
}

export interface NoteMetadata {
  firstImage: string | null;
  tasks: TaskItem[];
  previewText: string;
}

export function extractNoteMetadata(note: Note, maxTasks = 5): NoteMetadata {
  const content = note.content as JSONContent;
  const items: TaskItem[] = [];
  let firstImage: string | null = null;
  let textContent = "";

  const traverse = (nodes: JSONContent[]) => {
    if (!nodes) return;
    for (const node of nodes) {
      // Extract First Image
      if (!firstImage && node.type === "image" && node.attrs?.src) {
        firstImage = node.attrs.src;
      }

      // Extract Tasks
      if (items.length < maxTasks && node.type === "taskList") {
        node.content?.forEach((task: JSONContent) => {
          if (items.length < maxTasks && task.type === "taskItem") {
            const text = task.content?.[0]?.content?.[0]?.text || "";
            items.push({
              label: text,
              checked: task.attrs?.checked ?? false,
            });
          }
        });
      }

      // Extract Preview Text (if not already from searchText)
      if (node.type === "text" && node.text) {
        textContent += node.text + " ";
      }

      if (node.content) {
        traverse(node.content);
      }
    }
  };

  if (content && typeof content === "object" && !Array.isArray(content) && content.content) {
    traverse(content.content);
  }

  return {
    firstImage,
    tasks: items,
    previewText: note.searchText || textContent.trim() || "",
  };
}

export function toggleTaskInContent(content: Content | undefined, itemIndex: number): Content | undefined {
  if (!content || typeof content === "string" || Array.isArray(content) || !content.content) return content;

  const newContent = JSON.parse(JSON.stringify(content)) as JSONContent;
  let currentIndex = 0;
  let found = false;

  const traverseAndToggle = (nodes: JSONContent[]) => {
    if (!nodes) return;
    for (const node of nodes) {
      if (found) return;

      if (node.type === "taskList") {
        if (node.content) traverseAndToggle(node.content);
      } else if (node.type === "taskItem") {
        if (currentIndex === itemIndex) {
          const isChecked = node.attrs?.checked ?? false;
          node.attrs = { ...node.attrs, checked: !isChecked };
          found = true;
          return;
        }
        currentIndex++;
      } else if (node.content) {
        traverseAndToggle(node.content);
      }
    }
  };

  if (newContent.content) {
    traverseAndToggle(newContent.content);
  }
  return newContent;
}
