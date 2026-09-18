import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumes, templates } from "@/lib/db/schema";
import { updateResumeJson } from "@/lib/ai/resumeUpdaterAgent";

/**
 * Deploys Agent 2 (JSON Source-of-Truth Updater). Accepts a natural language
 * update, active templateId, and selected AI modelId, merges it into the
 * current resume JSON via LangChain structured output, validates the result, and
 * persists it as the new `current_json`.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  const body = await req.json();
  const { userUpdateInput, templateId, modelId } = body as {
    userUpdateInput?: string;
    templateId?: string;
    modelId?: string;
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

  let currentJson: Record<string, unknown>;
  try {
    currentJson = JSON.parse(resume.currentJson);
  } catch {
    currentJson = {};
  }

  // Check if a template with a custom schema is being used
  let customSchema: Record<string, unknown> | null = null;
  const activeTemplateId = templateId || resume.templateId;
  if (activeTemplateId) {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, activeTemplateId));
    if (template && template.schemaJson) {
      try {
        const parsed = JSON.parse(template.schemaJson);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          customSchema = parsed as Record<string, unknown>;
        }
      } catch (err) {
        console.warn("Failed to parse template schemaJson:", err);
      }
    }
  }

  let updatedJson: Record<string, unknown>;
  try {
    updatedJson = await updateResumeJson(
      currentJson,
      userUpdateInput,
      customSchema,
      modelId
    );
  } catch (err) {
    console.error("Agent 2 (resume updater) failed:", err);
    return NextResponse.json(
      { error: "AI update failed", details: `${err}` },
      { status: 502 }
    );
  }

  const now = new Date();

  await db
    .update(resumes)
    .set({
      currentJson: JSON.stringify(updatedJson),
      ...(activeTemplateId ? { templateId: activeTemplateId } : {}),
      updatedAt: now,
    })
    .where(eq(resumes.id, id));

  return NextResponse.json({
    resumeId: id,
    currentJson: updatedJson,
  });
}
