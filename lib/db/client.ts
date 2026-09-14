import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(DATA_DIR, "tracecv.sqlite");

declare global {
  var __tracecv_sqlite__: Database.Database | undefined;
}

// Reuse the same connection across hot reloads in dev.
const sqlite = global.__tracecv_sqlite__ ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== "production") {
  global.__tracecv_sqlite__ = sqlite;
}

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };
