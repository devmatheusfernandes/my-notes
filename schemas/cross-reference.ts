import { z } from "zod";

export const CrossReferenceRowSchema = z.object({
    vid: z.number(),
    sv: z.number(),
    ev: z.number(),
});

export type CrossReferenceRow = z.infer<typeof CrossReferenceRowSchema>;

export const TargetReferenceSchema = z.object({
    book: z.string(),
    chapter: z.number(),
    verse: z.number(),
    vid: z.number(),
});

export type TargetReference = z.infer<typeof TargetReferenceSchema>;