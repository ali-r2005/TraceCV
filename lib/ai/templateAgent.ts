import { getChatModel } from "./chatModel";
import { TemplateSchema, type GeneratedTemplate } from "./schemas";

/**
 * Agent 1: HTML Resume Template Generator Agent
 *
 * Converts raw design/layout instructions into a clean, responsive HTML/CSS
 * template with Handlebars placeholders bound to the Resume JSON Source of
 * Truth (see architecture document section 5, Agent 1).
 *
 * Uses `withStructuredOutput` so the model's response is guaranteed to match
 * the Zod schema rather than relying on a text-based output parser.
 */
export async function generateResumeTemplate(
  userDesignPrompt: string
): Promise<GeneratedTemplate> {
  const model = getChatModel(0.2);
  const structuredModel = model.withStructuredOutput(TemplateSchema);

  const systemPrompt = `
You are an expert UI/UX developer specialized in HTML/CSS resume printing templates.
Generate a complete, modern HTML template based on the user's instructions.

CRITICAL RULES:
1. HTML must bind parameters from this exact JSON schema using Handlebars syntax:
   - {{basics.fullName}}, {{basics.email}}, {{basics.summary}}
   - Loop arrays using Handlebars format: {{#each workExperience}} ... {{/each}}
2. Do NOT write JavaScript inside HTML.
3. Return only the templateName, htmlContent, and cssContent fields.
`;

  const response = await structuredModel.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userDesignPrompt },
  ]);

  return response;
}
