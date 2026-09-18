import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";
import { STANDARD_RESUME_JSON_SCHEMA } from "@/lib/db/seed";

export async function GET() {
  await ensureSeeded();
  const all = await db.select().from(templates).orderBy(desc(templates.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  try {
    const body = await req.json();
    const { name, description, htmlContent, cssContent, schemaJson } = body as {
      name?: string;
      description?: string;
      htmlContent?: string;
      cssContent?: string;
      schemaJson?: string | object;
    };

    if (!name || !htmlContent || cssContent === undefined) {
      return NextResponse.json(
        { error: "name, htmlContent and cssContent are required" },
        { status: 400 }
      );
    }

    // Format & validate schema JSON
    let finalSchemaJson = JSON.stringify(STANDARD_RESUME_JSON_SCHEMA, null, 2);
    if (schemaJson) {
      if (typeof schemaJson === "string") {
        try {
          const parsed = JSON.parse(schemaJson);
          finalSchemaJson = JSON.stringify(parsed, null, 2);
        } catch {
          return NextResponse.json(
            { error: "Invalid JSON provided in schemaJson" },
            { status: 400 }
          );
        }
      } else if (typeof schemaJson === "object") {
        finalSchemaJson = JSON.stringify(schemaJson, null, 2);
      }
    }

    const id = uuidv4();

    await db.insert(templates).values({
      id,
      name,
      description: description || "",
      htmlContent,
      cssContent,
      schemaJson: finalSchemaJson,
    });

    return NextResponse.json(
      { id, name, description, htmlContent, cssContent, schemaJson: finalSchemaJson },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create template", details: `${err}` },
      { status: 500 }
    );
  }
}
