import { z } from "zod";

export const letterSchema = z.object({
  userId: z.string(),
  id: z.string(),
  title: z
    .string()
    .min(1, "O título não pode ser vazio")
    .max(100, "O título é muito longo"),
  content: z.string(), // Texto extraído do PDF
  createdAt: z.string(),
  expiresAt: z.string(),
  isExpired: z.boolean().default(false),
});

export type Letter = z.infer<typeof letterSchema>;

export type CreateLetterDTO = Omit<
  z.input<typeof letterSchema>,
  "id" | "userId" | "isExpired" | "createdAt"
> & { createdAt?: string };
