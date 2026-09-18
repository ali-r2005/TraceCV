/**
 * One-time import of the old SQLite data (exported to data/sqlite_export.json
 * during the Supabase migration) into the new Postgres database. Run once
 * after DATABASE_URL is set and `npm run db:migrate` has created the tables:
 *
 *   npx tsx scripts/import-sqlite-export.mts
 */
import fs from "node:fs";
import path from "node:path";
import { db, client } from "../lib/db/client";
import { resumes, resumeVersions, templates, appSettings } from "../lib/db/schema";

type Dump = {
  resumes: Array<Record<string, unknown>>;
  resume_versions: Array<Record<string, unknown>>;
  templates: Array<Record<string, unknown>>;
  app_settings: Array<Record<string, unknown>>;
};

async function main() {
  const filePath = path.join(process.cwd(), "data", "sqlite_export.json");
  const dump = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Dump;

  if (dump.templates.length > 0) {
    await db.insert(templates).values(
      dump.templates.map((t) => ({
        id: t.id as string,
        name: t.name as string,
        description: t.description as string | null,
        htmlContent: t.html_content as string,
        cssContent: t.css_content as string,
        schemaJson: t.schema_json as string,
        createdAt: t.created_at ? new Date(t.created_at as string) : undefined,
      }))
    );
    console.log(`Imported ${dump.templates.length} template(s)`);
  }

  if (dump.resumes.length > 0) {
    await db.insert(resumes).values(
      dump.resumes.map((r) => ({
        id: r.id as string,
        title: r.title as string,
        templateId: r.template_id as string | null,
        currentJson: r.current_json as string,
        resumeGroupId: r.resume_group_id as string | null,
        language: r.language as string,
        syncSourceId: r.sync_source_id as string | null,
        syncBaseJson: r.sync_base_json as string | null,
        createdAt: r.created_at ? new Date(r.created_at as string) : undefined,
        updatedAt: r.updated_at ? new Date(r.updated_at as string) : undefined,
      }))
    );
    console.log(`Imported ${dump.resumes.length} resume(s)`);
  }

  if (dump.resume_versions.length > 0) {
    await db.insert(resumeVersions).values(
      dump.resume_versions.map((v) => ({
        id: v.id as string,
        resumeId: v.resume_id as string,
        versionNumber: v.version_number as number,
        changeSummary: v.change_summary as string,
        snapshotJson: v.snapshot_json as string,
        createdAt: v.created_at ? new Date(v.created_at as string) : undefined,
      }))
    );
    console.log(`Imported ${dump.resume_versions.length} resume version(s)`);
  }

  if (dump.app_settings.length > 0) {
    await db.insert(appSettings).values(
      dump.app_settings.map((s) => ({
        key: s.key as string,
        value: s.value as string,
        updatedAt: s.updated_at ? new Date(s.updated_at as string) : undefined,
      }))
    );
    console.log(`Imported ${dump.app_settings.length} app setting(s)`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
