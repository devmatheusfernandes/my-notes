import { z } from "zod";
import type { Content } from "@tiptap/react";

export const note = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, "O título não pode ser vazio")
    .max(30, "O título é muito longo"),
  content: z.custom<Content>(),
  tagIds: z.array(z.string()).default([]).optional(),
  folderId: z.string().optional(),
  archived: z.boolean().default(false).optional(),
  trashed: z.boolean().default(false).optional(),
  pinned: z.boolean().default(false).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  type: z.enum(["note", "pdf"]).default("note").optional(),
  fileUrl: z.string().optional(),
  isLocked: z.boolean().default(false).optional(),
});

export type Note = z.infer<typeof note>;
export type CreateNoteDTO = Omit<Note, "id" | "createdAt" | "updatedAt">;
