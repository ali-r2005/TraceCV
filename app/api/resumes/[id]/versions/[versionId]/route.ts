import "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db/client";
import { resumes, resumeVersions } from "@/lib/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(and(eq(resumeVersions.resumeId, id), eq(resumeVersions.id, versionId)));

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }
  return NextResponse.json(version);
}

/**
 * Rollback: restores a prior snapshot as the resume's current_json and
 * records the rollback itself as a brand-new version entry, preserving
 * full history rather than truncating it.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;

  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(and(eq(resumeVersions.resumeId, id), eq(resumeVersions.id, versionId)));

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const all = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.resumeId, id));
  const nextVersionNumber =
    Math.max(0, ...all.map((v) => v.versionNumber)) + 1;

  const now = new Date().toISOString();

  await db
    .update(resumes)
    .set({ currentJson: version.snapshotJson, updatedAt: now })
    .where(eq(resumes.id, id));

  await db.insert(resumeVersions).values({
    id: uuidv4(),
    resumeId: id,
    versionNumber: nextVersionNumber,
    changeSummary: `Rolled back to version ${version.versionNumber}`,
    snapshotJson: version.snapshotJson,
    createdAt: now,
  });

  return NextResponse.json({
    resumeId: id,
    versionNumber: nextVersionNumber,
    currentJson: JSON.parse(version.snapshotJson),
  });
}
