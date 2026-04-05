import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function checkEmbeddings() {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("TURSO_CONNECTION_URL não encontrada.");
    return;
  }

  const client = createClient({ url, authToken });

  try {
    const res = await client.execute("SELECT sync_status, count(*) as count FROM embeddings_queue GROUP BY sync_status");
    console.log("Status de Embeddings:");
    console.table(res.rows);

    const samples = await client.execute("SELECT source_type, content_to_embed FROM embeddings_queue WHERE sync_status = 'synced' LIMIT 3");
    console.log("\nAmostra de conteúdos sincronizados:");
    console.table(samples.rows);

  } catch (error) {
    console.error("Erro ao consultar Turso:", error);
  }
}

checkEmbeddings();
