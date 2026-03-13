import z from "zod";

export const folder = z.object({
  userId: z.string(),
  id: z.string(),
  title: z
    .string()
    .min(1, "O título não pode ser vazio")
    .max(20, "O título é muito longo")
    .default("Nova Pasta"),
  parentId: z.string().optional(),
  color: z.string().optional(),
  archived: z.boolean().default(false),
  trashed: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  isLocked: z.boolean().default(false),
});

export type Folder = z.infer<typeof folder>;

export type CreateFolderDTO = Omit<
  z.input<typeof folder>,
  "id" | "createdAt" | "updatedAt" | "userId"
>;
