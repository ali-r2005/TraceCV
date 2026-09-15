import "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
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
 * permanently deletes every version committed after it (git reset --hard
 * semantics) — the rollback target becomes the new tip of history.
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

  const now = new Date().toISOString();

  await db
    .delete(resumeVersions)
    .where(
      and(
        eq(resumeVersions.resumeId, id),
        gt(resumeVersions.versionNumber, version.versionNumber)
      )
    );

  await db
    .update(resumes)
    .set({ currentJson: version.snapshotJson, updatedAt: now })
    .where(eq(resumes.id, id));

  return NextResponse.json({
    resumeId: id,
    versionNumber: version.versionNumber,
    currentJson: JSON.parse(version.snapshotJson),
  });
}
