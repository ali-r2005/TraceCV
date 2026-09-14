import Handlebars from "handlebars";
import type { ResumeJson } from "@/lib/ai/schemas";

// Small set of helpers useful in resume templates.
Handlebars.registerHelper("join", (arr: unknown, sep: string) =>
  Array.isArray(arr) ? arr.join(sep ?? ", ") : ""
);

Handlebars.registerHelper("dateRange", (start: string, end: string) => {
  if (!start) return end || "";
  return `${start} — ${end || "Present"}`;
});

const compiledCache = new Map<string, HandlebarsTemplateDelegate>();

function getCompiledTemplate(htmlContent: string) {
  let compiled = compiledCache.get(htmlContent);
  if (!compiled) {
    compiled = Handlebars.compile(htmlContent, { noEscape: false });
    compiledCache.set(htmlContent, compiled);
  }
  return compiled;
}

/**
 * Injects a validated Resume JSON payload into a Handlebars HTML template,
 * wrapping the result with the template's own CSS for a self-contained
 * document suitable for live preview or PDF export.
 */
export function renderResumeHtml(
  htmlContent: string,
  cssContent: string,
  data: ResumeJson
): string {
  const template = getCompiledTemplate(htmlContent);
  const body = template(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(data.basics?.fullName ?? "Resume")}</title>
<style>${cssContent}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
