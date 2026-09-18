import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { compare, applyPatch, type Operation } from "fast-json-patch";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumes } from "@/lib/db/schema";
import { translateJsonPatch } from "@/lib/ai/translateAgent";

/**
 * Syncs a translated resume with changes made on its source-language
 * sibling since the last sync. Computes the diff between what this resume
 * last saw of the source (sync_base_json) and the source's current state,
 * translates only that diff, and applies it here as a staged (uncommitted)
 * change for the user to review before committing.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { modelId } = body as { modelId?: string };

  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  if (!resume.syncSourceId) {
    return NextResponse.json(
      { error: "This resume has no linked source language to sync from." },
      { status: 400 }
    );
  }

  const [source] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.id, resume.syncSourceId));
  if (!source) {
    return NextResponse.json(
      { error: "The linked source resume no longer exists." },
      { status: 404 }
    );
  }

  let baseJson: Record<string, unknown>;
  try {
    baseJson = resume.syncBaseJson ? JSON.parse(resume.syncBaseJson) : {};
  } catch {
    baseJson = {};
  }

  let sourceJson: Record<string, unknown>;
  try {
    sourceJson = JSON.parse(source.currentJson);
  } catch {
    sourceJson = {};
  }

  const diff = compare(baseJson, sourceJson);
  if (diff.length === 0) {
    return NextResponse.json({
      resumeId: id,
      currentJson: JSON.parse(resume.currentJson),
      changed: false,
      message: `No changes to sync — this resume is already up to date with ${source.language}.`,
    });
  }

  let translatedDiff: Operation[];
  try {
    translatedDiff = await translateJsonPatch(diff, resume.language, modelId);
  } catch (err) {
    console.error("Agent 3 (patch translator) failed:", err);
    return NextResponse.json(
      { error: "AI translation failed", details: `${err}` },
      { status: 502 }
    );
  }

  let currentJson: Record<string, unknown>;
  try {
    currentJson = JSON.parse(resume.currentJson);
  } catch {
    currentJson = {};
  }

  let updatedJson: Record<string, unknown>;
  try {
    const result = applyPatch(currentJson, translatedDiff, true, false);
    updatedJson = result.newDocument as Record<string, unknown>;
  } catch (err) {
    console.error("Failed to apply translated sync patch:", err);
    return NextResponse.json(
      {
        error:
          "The AI-translated patch could not be applied cleanly. The source resume may have changed too much to auto-sync — try a manual update instead.",
        details: `${err}`,
      },
      { status: 502 }
    );
  }

  const now = new Date();

  await db
    .update(resumes)
    .set({
      currentJson: JSON.stringify(updatedJson),
      syncBaseJson: source.currentJson,
      updatedAt: now,
    })
    .where(eq(resumes.id, id));

  return NextResponse.json({
    resumeId: id,
    currentJson: updatedJson,
    changed: true,
    appliedOps: translatedDiff.length,
  });
}
