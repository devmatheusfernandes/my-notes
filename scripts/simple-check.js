import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function check() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  try {
    const res = await client.execute("SELECT sync_status, count(*) as count FROM embeddings_queue GROUP BY sync_status");
    console.log("RESULT_START");
    console.log(JSON.stringify(res.rows, null, 2));
    console.log("RESULT_END");
  } catch (e) {
    console.error(e);
  }
}
check();
