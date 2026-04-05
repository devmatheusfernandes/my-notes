import { db } from "../lib/db/turso";
import { embeddingsQueue } from "../lib/db/schema";
import { count, eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function checkEmbeddings() {
  try {
    const counts = await db
      .select({
        status: embeddingsQueue.syncStatus,
        count: count()
      })
      .from(embeddingsQueue)
      .groupBy(embeddingsQueue.syncStatus);

    console.log("Status de Embeddings no Banco de Dados (Turso):");
    if (counts.length === 0) {
      console.log("Nenhum registro de embedding encontrado.");
    } else {
      counts.forEach(c => {
        console.log(`- ${c.status || 'pending'}: ${c.count} registros`);
      });
    }

    // Check for some actual synced records
    const sample = await db
      .select({
        sourceType: embeddingsQueue.sourceType,
        content: embeddingsQueue.contentToEmbed,
      })
      .from(embeddingsQueue)
      .where(eq(embeddingsQueue.syncStatus, 'synced'))
      .limit(3);

    if (sample.length > 0) {
      console.log("\nAmostra de conteúdos sincronizados:");
      sample.forEach((s, i) => {
        console.log(`${i+1}. [${s.sourceType}] ${s.content.substring(0, 100)}...`);
      });
    }

  } catch (error) {
    console.error("Erro ao verificar banco de dados:", error);
  }
}

checkEmbeddings();
