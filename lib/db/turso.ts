import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const getClient = () => {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_CONNECTION_URL is not defined");
  }

  return createClient({
    url,
    authToken: authToken || "",
  });
};

export const client = typeof window === "undefined" ? getClient() : null as unknown as ReturnType<typeof getClient>;
export const db = client ? drizzle(client) : null as unknown as ReturnType<typeof drizzle>;
