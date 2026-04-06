import { z } from "zod";
import type { Content } from "@tiptap/react";

export const note = z.object({
  userId: z.string(),
  id: z.string(),
  title: z
    .string()
    .min(1, "O título não pode ser vazio")
    .max(150, "O título é muito longo")
    .default("Nova Nota"),
  content: z.custom<Content>().optional().nullable(),
  searchText: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  folderId: z.string().optional(),
  archived: z.boolean().default(false),
  trashed: z.boolean().default(false),
  pinned: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  type: z.enum(["note", "pdf"]).default("note"),
  fileUrl: z.string().optional(),
  isLocked: z.boolean().default(false),
  searchTokens: z.string().optional().nullable(),
  searchTokensUpdatedAt: z.string().optional().nullable(),
});

export type Note = z.infer<typeof note>;

export type CreateNoteDTO = Omit<
  z.input<typeof note>,
  "id" | "createdAt" | "updatedAt" | "userId"
>;
