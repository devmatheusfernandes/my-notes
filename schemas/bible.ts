import { z } from "zod";

export const BibleSchema = z.record(
    // [book: string]
    z.string(),
    z.record(
        // [chapter: string]
        z.string(),
        z.object({
            // versos: { [verse: string]: string }
            versos: z.record(z.string(), z.string()),
            // notas?: string
            notas: z.string().optional(),
        })
    )
);

export type Bible = z.infer<typeof BibleSchema>;

/*
{
  "Gênesis": {
    "1": {
      "versos": {
        "1": "No princípio Deus criou os céus e a terra.",
        "2": "A terra era vazia e deserta, ..."
      },
      "notas": "^ Gên. 1:2 Ou: ..."
    }
  }
}
/// Acesso:
/// data["Gênesis"]["1"].versos["1"]
*/