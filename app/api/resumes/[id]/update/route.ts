import "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db/client";
import { resumes, resumeVersions } from "@/lib/db/schema";
import { ResumeSchema } from "@/lib/ai/schemas";
import { updateResumeJson } from "@/lib/ai/resumeUpdaterAgent";

/**
 * Deploys Agent 2 (JSON Source-of-Truth Updater). Accepts a natural language
 * update, merges it into the current resume JSON via LangChain + Zod
 * structured output, validates the result, persists it as the new
 * `current_json`, and writes a new snapshot to resume_versions.
 * (Architecture document section 6, step 5.)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { userUpdateInput, changeSummary } = body as {
    userUpdateInput?: string;
    changeSummary?: string;
  };

  if (!userUpdateInput || !userUpdateInput.trim()) {
    return NextResponse.json(
      { error: "userUpdateInput is required" },
      { status: 400 }
    );
  }

  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const currentJson = ResumeSchema.parse(JSON.parse(resume.currentJson));

  let updatedJson;
  try {
    updatedJson = await updateResumeJson(currentJson, userUpdateInput);
  } catch (err) {
    console.error("Agent 2 (resume updater) failed:", err);
    return NextResponse.json(
      { error: "AI update failed", details: `${err}` },
      { status: 502 }
    );
  }

  // Enforce schema compliance before persisting anything.
  const validated = ResumeSchema.parse(updatedJson);

  const now = new Date().toISOString();

  const [lastVersion] = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.resumeId, id))
    .orderBy(desc(resumeVersions.versionNumber))
    .limit(1);

  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  await db
    .update(resumes)
    .set({ currentJson: JSON.stringify(validated), updatedAt: now })
    .where(eq(resumes.id, id));

  await db.insert(resumeVersions).values({
    id: uuidv4(),
    resumeId: id,
    versionNumber: nextVersionNumber,
    changeSummary: changeSummary || userUpdateInput.slice(0, 200),
    snapshotJson: JSON.stringify(validated),
    createdAt: now,
  });

  return NextResponse.json({
    resumeId: id,
    versionNumber: nextVersionNumber,
    currentJson: validated,
  });
}
