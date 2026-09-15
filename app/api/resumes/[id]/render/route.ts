import "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumes, resumeVersions, templates } from "@/lib/db/schema";
import { renderResumeHtml } from "@/lib/render/renderResume";
import {
  DEFAULT_TEMPLATE_HTML,
  DEFAULT_TEMPLATE_CSS,
} from "@/lib/render/defaultTemplate";

/**
 * Combines the resume's current JSON (or a specific version, via
 * ?versionId=) with an HTML template (via ?templateId=, or the built-in
 * default) to produce a self-contained HTML document for live preview.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const urlTemplateId = req.nextUrl.searchParams.get("templateId");
  const versionId = req.nextUrl.searchParams.get("versionId");

  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  let snapshotJson = resume.currentJson;
  if (versionId) {
    const [version] = await db
      .select()
      .from(resumeVersions)
      .where(and(eq(resumeVersions.resumeId, id), eq(resumeVersions.id, versionId)));
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
    snapshotJson = version.snapshotJson;
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(snapshotJson);
  } catch {
    data = {};
  }

  const effectiveTemplateId = urlTemplateId || resume.templateId;
  let htmlContent = DEFAULT_TEMPLATE_HTML;
  let cssContent = DEFAULT_TEMPLATE_CSS;

  if (effectiveTemplateId) {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, effectiveTemplateId));
    if (template) {
      htmlContent = template.htmlContent;
      cssContent = template.cssContent;
    }
  }

  const html = renderResumeHtml(htmlContent, cssContent, data);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
