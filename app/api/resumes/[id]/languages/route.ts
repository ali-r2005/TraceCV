import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumes } from "@/lib/db/schema";
import { translateResumeJson } from "@/lib/ai/translateAgent";

/**
 * Lists every language version sibling of a resume (rows sharing the same
 * resume_group_id), including the resume itself.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const groupId = resume.resumeGroupId || resume.id;
  const siblings = await db
    .select()
    .from(resumes)
    .where(eq(resumes.resumeGroupId, groupId));

  return NextResponse.json(siblings);
}

/**
 * Adds a new language version of a resume: clones the source resume's
 * current_json into a new row in the same resume_group, then translates it
 * via Agent 3. The new resume starts with no version history — the user
 * reviews the translation and commits it themselves.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  const body = await req.json();
  const { language, modelId } = body as { language?: string; modelId?: string };

  if (!language || !language.trim()) {
    return NextResponse.json({ error: "language is required" }, { status: 400 });
  }

  const [source] = await db.select().from(resumes).where(eq(resumes.id, id));
  if (!source) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const groupId = source.resumeGroupId || source.id;
  const normalizedLanguage = language.trim();

  const existing = await db
    .select()
    .from(resumes)
    .where(eq(resumes.resumeGroupId, groupId));

  const alreadyExists = existing.some(
    (r) => r.language.toLowerCase() === normalizedLanguage.toLowerCase()
  );
  if (alreadyExists) {
    return NextResponse.json(
      { error: `A "${normalizedLanguage}" version already exists for this resume.` },
      { status: 409 }
    );
  }

  let sourceJson: Record<string, unknown>;
  try {
    sourceJson = JSON.parse(source.currentJson);
  } catch {
    sourceJson = {};
  }

  let translatedJson: Record<string, unknown>;
  try {
    translatedJson = await translateResumeJson(sourceJson, normalizedLanguage, modelId);
  } catch (err) {
    console.error("Agent 3 (translator) failed:", err);
    return NextResponse.json(
      { error: "AI translation failed", details: `${err}` },
      { status: 502 }
    );
  }

  const newId = uuidv4();
  const now = new Date();

  await db.insert(resumes).values({
    id: newId,
    title: source.title,
    templateId: source.templateId,
    currentJson: JSON.stringify(translatedJson),
    resumeGroupId: groupId,
    language: normalizedLanguage,
    syncSourceId: source.id,
    syncBaseJson: source.currentJson,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db.select().from(resumes).where(eq(resumes.id, newId));

  return NextResponse.json(created, { status: 201 });
}
