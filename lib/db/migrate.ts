/**
 * Bootstraps the SQLite schema directly (no migration folder needed for this
 * project's scope). Safe to call multiple times — uses CREATE TABLE IF NOT EXISTS.
 * Mirrors the DDL in the architecture document section 3.
 */
import { sqlite } from "./client";

export function ensureSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

ensureSchema();
