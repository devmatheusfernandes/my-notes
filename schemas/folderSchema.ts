import z from "zod";

export const folder = z.object({
  userId: z.string(),
  id: z.string(),
  name: z.string(),
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
