import { sqliteTable, text, integer, blob, unique } from "drizzle-orm/sqlite-core";

export const embeddingsQueue = sqliteTable("embeddings_queue", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  sourceId: text("source_id").notNull(),
  sourceType: text("source_type", { enum: ["note", "video"] }).notNull(),
  contentToEmbed: text("content_to_embed").notNull(),
  embedding: blob("embedding"), // Store F32_BLOB
  syncStatus: text("sync_status", { enum: ["pending", "synced", "error"] }).default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  unique("source_unique").on(table.sourceId, table.sourceType),
]);

// run "npx drizzle-kit push" to update the database schema