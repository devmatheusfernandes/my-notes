import { z } from "zod";

export const userSettings = z.object({
  userId: z.string(),
  pinSalt: z.string().nullable().default(null),
  pinHash: z.string().nullable().default(null),
  biometricEnabled: z.boolean().default(false),
  biometricCredentialId: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserSettings = z.infer<typeof userSettings>;
