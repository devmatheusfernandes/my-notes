import { z } from "zod";

export const tag = z.object({
    id: z.string(),
    title: z
      .string()
      .min(1, "O título não pode ser vazio")
      .max(15, "O título é muito longo"),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    color: z.string().optional(),
})

export type Tag = z.infer<typeof tag>;

export type CreateTagDTO = Omit<
  z.input<typeof tag>,
  "id" | "createdAt" | "updatedAt" | "userId"
>;