import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Ajv, { type ErrorObject } from "ajv";
import { db } from "@/lib/db/client";
import { resumes, templates } from "@/lib/db/schema";
import { ResumeSchema } from "@/lib/ai/schemas";

const ajv = new Ajv({ allErrors: true, strict: false });

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return "Unknown validation error.";
  return errors.map((e) => `- ${e.instancePath || "/"} ${e.message}`).join("\n");
}

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
  return NextResponse.json(resume);
}

/**
 * Manual JSON editor save: lets the user directly overwrite the resume's
 * `current_json` (the source of truth) without going through the AI agent.
 * Still validated against the active template's custom schema (Ajv) or the
 * standard resume schema (Zod), so hand-edited JSON can't corrupt the data.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const currentJson = body?.currentJson;

  if (!currentJson || typeof currentJson !== "object" || Array.isArray(currentJson)) {
    return NextResponse.json(
      { error: "currentJson must be a JSON object" },
      { status: 400 }
    );
  }

  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  let customSchema: Record<string, unknown> | null = null;
  if (resume.templateId) {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, resume.templateId));
    if (template?.schemaJson) {
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

  if (customSchema) {
    let validate;
    try {
      validate = ajv.compile(customSchema);
    } catch (err) {
      return NextResponse.json(
        { error: `This template's custom schema is not a valid JSON Schema: ${err}` },
        { status: 500 }
      );
    }
    if (!validate(currentJson)) {
      return NextResponse.json(
        {
          error: "This JSON does not match the template's custom schema",
          details: formatAjvErrors(validate.errors),
        },
        { status: 400 }
      );
    }
  } else {
    const validated = ResumeSchema.safeParse(currentJson);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "This JSON does not match the standard resume schema",
          details: validated.error.message,
        },
        { status: 400 }
      );
    }
  }

  const now = new Date();
  await db
    .update(resumes)
    .set({ currentJson: JSON.stringify(currentJson), updatedAt: now })
    .where(eq(resumes.id, id));

  return NextResponse.json({ resumeId: id, currentJson });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  await db.delete(resumes).where(eq(resumes.id, id));
  return NextResponse.json({ ok: true });
}
