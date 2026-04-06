import { z } from "zod";

export const userSettings = z.object({
  userId: z.string(),
  pinSalt: z.string().nullable().default(null),
  pinHash: z.string().nullable().default(null),
  biometricEnabled: z.boolean().default(false),
  biometricCredentialId: z.string().nullable().default(null),

  // Backup Settings
  autoBackupEnabled: z.boolean().default(false),
  autoBackupTime: z.string().default("02:00"),
  autoBackupFrequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  lastBackupAt: z.string().nullable().default(null),
  driveRefreshToken: z.string().nullable().default(null),

  // Chat Settings
  showSearchAccuracy: z.boolean().default(false),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserSettings = z.infer<typeof userSettings>;
