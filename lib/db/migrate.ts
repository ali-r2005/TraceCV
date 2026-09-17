/**
 * Bootstraps the SQLite schema directly and seeds example templates.
 * Safe to call multiple times.
 */
import { sqlite } from "./client";
import { seedDefaultTemplates, seedCompactPhotoCv } from "./seed";

export function ensureSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      template_id TEXT,
      current_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resume_versions (
      id TEXT PRIMARY KEY,
      resume_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      change_summary TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      html_content TEXT NOT NULL,
      css_content TEXT NOT NULL,
      schema_json TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure column additions if database existed previously
  try {
    const templateColumns = sqlite
      .prepare("PRAGMA table_info(templates)")
      .all() as Array<{ name: string }>;
    if (!templateColumns.some((col) => col.name === "schema_json")) {
      sqlite.exec("ALTER TABLE templates ADD COLUMN schema_json TEXT NOT NULL DEFAULT '{}'");
    }

    const resumeColumns = sqlite
      .prepare("PRAGMA table_info(resumes)")
      .all() as Array<{ name: string }>;
    if (!resumeColumns.some((col) => col.name === "template_id")) {
      sqlite.exec("ALTER TABLE resumes ADD COLUMN template_id TEXT");
    }
    if (!resumeColumns.some((col) => col.name === "resume_group_id")) {
      sqlite.exec("ALTER TABLE resumes ADD COLUMN resume_group_id TEXT");
      // Every pre-existing resume becomes the sole member of its own group.
      sqlite.exec("UPDATE resumes SET resume_group_id = id WHERE resume_group_id IS NULL");
    }
    if (!resumeColumns.some((col) => col.name === "language")) {
      sqlite.exec("ALTER TABLE resumes ADD COLUMN language TEXT NOT NULL DEFAULT 'en'");
    }
    if (!resumeColumns.some((col) => col.name === "sync_source_id")) {
      sqlite.exec("ALTER TABLE resumes ADD COLUMN sync_source_id TEXT");
    }
    if (!resumeColumns.some((col) => col.name === "sync_base_json")) {
      sqlite.exec("ALTER TABLE resumes ADD COLUMN sync_base_json TEXT");
    }
  } catch (err) {
    console.error("Migration column check error:", err);
  }

  // Seed default templates if empty
  seedDefaultTemplates();
  seedCompactPhotoCv();
}

ensureSchema();
