import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumes, templates } from "@/lib/db/schema";
import { renderResumeHtml } from "@/lib/render/renderResume";
import { renderHtmlToPdf } from "@/lib/render/exportPdf";
import {
  DEFAULT_TEMPLATE_HTML,
  DEFAULT_TEMPLATE_CSS,
} from "@/lib/render/defaultTemplate";

/**
 * Export Pipeline (architecture document section 6, step 6): renders the
 * resume through Handlebars, then converts the resulting HTML into a
 * downloadable PDF via Puppeteer.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const { id } = await params;
  const urlTemplateId = req.nextUrl.searchParams.get("templateId");

  const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(resume.currentJson);
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

  try {
    const pdf = await renderHtmlToPdf(html);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(resume.title || "resume").replace(/[^a-z0-9-_]+/gi, "_")}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF export failed:", err);
    return NextResponse.json(
      {
        error:
          "PDF export failed. Ensure a Chromium binary is installed for Puppeteer (run: npx puppeteer browsers install chrome).",
        details: `${err}`,
      },
      { status: 500 }
    );
  }
}
