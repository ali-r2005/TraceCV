import "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumes, resumeVersions, templates } from "@/lib/db/schema";
import { emptyResumeJson } from "@/lib/ai/schemas";

export async function GET() {
  const all = await db.select().from(resumes).orderBy(desc(resumes.updatedAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, fullName, email, templateId } = body as {
    title?: string;
    fullName?: string;
    email?: string;
    templateId?: string;
  };

  if (!fullName || !email) {
    return NextResponse.json(
      { error: "fullName and email are required" },
      { status: 400 }
    );
  }

  if (!templateId) {
    return NextResponse.json(
      { error: "A template must be selected to create a resume." },
      { status: 400 }
    );
  }

  // Verify template exists
  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId));

  if (!template) {
    return NextResponse.json(
      { error: "The selected template was not found." },
      { status: 404 }
    );
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const resumeTitle = title || `${fullName}'s Resume`;
  const json = emptyResumeJson(fullName, email);

  await db.insert(resumes).values({
    id,
    title: resumeTitle,
    templateId,
    currentJson: JSON.stringify(json),
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(resumeVersions).values({
    id: uuidv4(),
    resumeId: id,
    versionNumber: 1,
    changeSummary: `Initial resume created with template: ${template.name}`,
    snapshotJson: JSON.stringify(json),
    createdAt: now,
  });

  const [created] = await db.select().from(resumes).where(eq(resumes.id, id));

  return NextResponse.json(created, { status: 201 });
}
