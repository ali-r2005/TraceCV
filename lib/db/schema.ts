import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * 1. Resumes — Core entity representing a user's master resume profile.
 * `currentJson` holds the master JSON Source of Truth (see lib/ai/schemas.ts).
 */
export const resumes = sqliteTable("resumes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  currentJson: text("current_json").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

/**
 * 2. Resume Versions — Tracks history & AI modifications over time.
 */
export const resumeVersions = sqliteTable("resume_versions", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  changeSummary: text("change_summary").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/**
 * 3. Templates — Stores custom HTML/CSS templates for rendering.
 */
export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  htmlContent: text("html_content").notNull(),
  cssContent: text("css_content").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type ResumeVersion = typeof resumeVersions.$inferSelect;
export type NewResumeVersion = typeof resumeVersions.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
