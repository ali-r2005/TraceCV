import "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumes, templates } from "@/lib/db/schema";
import { ResumeSchema } from "@/lib/ai/schemas";
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
  const templateId = req.nextUrl.searchParams.get("templateId");

  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const data = ResumeSchema.parse(JSON.parse(resume.currentJson));

  let htmlContent = DEFAULT_TEMPLATE_HTML;
  let cssContent = DEFAULT_TEMPLATE_CSS;

  if (templateId) {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, templateId));
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    htmlContent = template.htmlContent;
    cssContent = template.cssContent;
  }

  const html = renderResumeHtml(htmlContent, cssContent, data);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
