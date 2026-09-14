import "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [template] = await db.select().from(templates).where(eq(templates.id, id));
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json(template);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, htmlContent, cssContent } = body as {
    name?: string;
    description?: string;
    htmlContent?: string;
    cssContent?: string;
  };

  await db
    .update(templates)
    .set({
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(htmlContent !== undefined ? { htmlContent } : {}),
      ...(cssContent !== undefined ? { cssContent } : {}),
    })
    .where(eq(templates.id, id));

  const [updated] = await db.select().from(templates).where(eq(templates.id, id));
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(templates).where(eq(templates.id, id));
  return NextResponse.json({ ok: true });
}
