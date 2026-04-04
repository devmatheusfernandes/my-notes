import { z } from "zod";

export const StrongResultSchema = z.object({
    id: z.string(),
    originalId: z.string(),
    lemma: z.string(),
    transliteration: z.string(),
    pronunciation: z.string(),
    definition: z.string(),
    usage: z.string().optional(),
    derivation: z.string().optional(),
    type: z.enum(["greek", "hebrew"]),
});

export type StrongResult = z.infer<typeof StrongResultSchema>;