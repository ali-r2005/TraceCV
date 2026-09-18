import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db/client";
import { resumes, resumeVersions } from "@/lib/db/schema";

/**
 * Commits the resume's current working state (`current_json`) as a new
 * version snapshot, tagged with a user-provided commit message.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  const body = await req.json();
  const { changeSummary } = body as { changeSummary?: string };

  if (!changeSummary || !changeSummary.trim()) {
    return NextResponse.json(
      { error: "changeSummary is required" },
      { status: 400 }
    );
  }

  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const [lastVersion] = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.resumeId, id))
    .orderBy(desc(resumeVersions.versionNumber))
    .limit(1);

  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;
  const now = new Date();

  const [committed] = await db
    .insert(resumeVersions)
    .values({
      id: uuidv4(),
      resumeId: id,
      versionNumber: nextVersionNumber,
      changeSummary: changeSummary.trim(),
      snapshotJson: resume.currentJson,
      createdAt: now,
    })
    .returning();

  return NextResponse.json(committed);
}
