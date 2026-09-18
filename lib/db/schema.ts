import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * 1. Resumes — Core entity representing a user's master resume profile.
 * `currentJson` holds the master JSON Source of Truth (see lib/ai/schemas.ts).
 */
export const resumes = pgTable("resumes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  templateId: text("template_id"),
  currentJson: text("current_json").notNull(),
  resumeGroupId: text("resume_group_id"),
  language: text("language").notNull().default("en"),
  syncSourceId: text("sync_source_id"),
  syncBaseJson: text("sync_base_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

/**
 * 2. Resume Versions — Tracks history & AI modifications over time.
 */
export const resumeVersions = pgTable("resume_versions", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  changeSummary: text("change_summary").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

/**
 * 3. Templates — Stores custom HTML/CSS templates and their JSON schemas for rendering.
 */
export const templates = pgTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  htmlContent: text("html_content").notNull(),
  cssContent: text("css_content").notNull(),
  schemaJson: text("schema_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

/**
 * 4. App Settings — Stores application configuration and API secrets strictly in DB.
 */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type ResumeVersion = typeof resumeVersions.$inferSelect;
export type NewResumeVersion = typeof resumeVersions.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
