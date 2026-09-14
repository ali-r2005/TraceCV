import "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";

export async function GET() {
  const all = await db.select().from(templates).orderBy(desc(templates.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, htmlContent, cssContent } = body as {
    name?: string;
    description?: string;
    htmlContent?: string;
    cssContent?: string;
  };

  if (!name || !htmlContent || cssContent === undefined) {
    return NextResponse.json(
      { error: "name, htmlContent and cssContent are required" },
      { status: 400 }
    );
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(templates).values({
    id,
    name,
    description: description || "",
    htmlContent,
    cssContent,
    createdAt: now,
  });

  return NextResponse.json({ id, name, description, htmlContent, cssContent }, { status: 201 });
}
