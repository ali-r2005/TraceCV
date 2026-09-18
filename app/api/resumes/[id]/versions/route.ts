import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumeVersions } from "@/lib/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  const versions = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.resumeId, id))
    .orderBy(desc(resumeVersions.versionNumber));

  return NextResponse.json(versions);
}
