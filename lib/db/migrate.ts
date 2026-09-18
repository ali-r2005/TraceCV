/**
 * Table creation now lives in versioned SQL migrations under ./drizzle,
 * applied once via `npm run db:migrate` (Drizzle Kit) — not hand-rolled
 * DDL run on every request like the old SQLite setup.
 *
 * This module only seeds default data, and is safe to call repeatedly.
 */
import { seedDefaultTemplates, seedCompactPhotoCv } from "./seed";

let seeded: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      await seedDefaultTemplates();
      await seedCompactPhotoCv();
    })();
  }
  return seeded;
}
