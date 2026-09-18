import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

// drizzle-kit's CLI doesn't auto-load .env.local like Next.js does.
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, "utf-8").split("\n")) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
