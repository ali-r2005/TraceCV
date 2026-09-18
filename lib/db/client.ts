import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add your Supabase Postgres connection string to .env.local."
  );
}

declare global {
  var __tracecv_pg__: ReturnType<typeof postgres> | undefined;
}

// Reuse the same connection pool across hot reloads in dev.
const client = global.__tracecv_pg__ ?? postgres(DATABASE_URL, { prepare: false });
if (process.env.NODE_ENV !== "production") {
  global.__tracecv_pg__ = client;
}

export const db = drizzle(client, { schema });
export { client };
