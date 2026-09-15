import { getChatModel } from "./chatModel";
import { ResumeSchema, type ResumeJson } from "./schemas";

/**
 * Agent 2: Dynamic JSON Source-of-Truth Updater Agent
 *
 * Takes a natural language update alongside current JSON state, active
 * template's JSON schema, and selected AI modelId, updates/formats the data
 * to strictly match the schema, and returns the updated JSON object.
 */
export async function updateResumeJson(
  currentJson: Record<string, unknown>,
  userUpdateInput: string,
  customSchema?: Record<string, unknown> | null,
  modelId?: string
): Promise<Record<string, unknown>> {
  const llm = getChatModel({ modelId, temperature: 0 });

  // If a custom schema is provided, use dynamic schema instruction & structured output
  if (customSchema && typeof customSchema === "object" && Object.keys(customSchema).length > 0) {
    const schemaTitle =
      typeof customSchema.title === "string"
        ? customSchema.title
        : "CustomResumeTemplateData";
    
    // Check if we can use structured output directly with the JSON schema
    let structuredLlm;
    try {
      structuredLlm = llm.withStructuredOutput({
        name: schemaTitle,
        description: "Updated resume data strictly matching the template schema",
        parameters: customSchema,
      });
    } catch {
      // Fallback if provider doesn't support raw parameter object
      structuredLlm = null;
    }

    const systemPrompt = `
You are an expert AI Resume Editor.
Your objective is to update the user's resume data while strictly respecting the template's JSON Schema.

TARGET JSON SCHEMA:
${JSON.stringify(customSchema, null, 2)}

RULES:
1. Parse the user's natural language update input.
2. Update, append, or modify the appropriate fields according to the TARGET JSON SCHEMA.
3. Keep pre-existing data intact unless the user explicitly requested modifying or removing it.
4. Formulate strong, action-driven bullet points using Google's X-Y-Z formula ("Accomplished X as measured by Y by doing Z") where applicable.
5. You MUST ensure the returned JSON strictly matches the target schema properties and types.
`;

    if (structuredLlm) {
      const response = await structuredLlm.invoke([
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `CURRENT RESUME DATA:\n${JSON.stringify(
            currentJson,
            null,
            2
          )}\n\nUSER UPDATE REQUEST:\n${userUpdateInput}`,
        },
      ]);
      return response as Record<string, unknown>;
    } else {
      // Prompt LLM for strict JSON output and parse
      const response = await llm.invoke([
        {
          role: "system",
          content: `${systemPrompt}\nIMPORTANT: Respond ONLY with a valid JSON object matching the schema. Do not enclose in markdown blocks.`,
        },
        {
          role: "user",
          content: `CURRENT RESUME DATA:\n${JSON.stringify(
            currentJson,
            null,
            2
          )}\n\nUSER UPDATE REQUEST:\n${userUpdateInput}`,
        },
      ]);

      const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      const cleanJson = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleanJson);
    }
  }

  // Fallback to standard master ResumeSchema
  const structuredLlm = llm.withStructuredOutput(ResumeSchema);

  const systemPrompt = `
You are an expert AI Resume Editor.
Your objective is to update the user's JSON Resume Source of Truth while strictly maintaining structure.

RULES:
1. Parse the user's natural language update input.
2. Identify target section (e.g., adding an entry to "workExperience", appending "skills", updating "basics").
3. Append the new item inside the appropriate array while leaving pre-existing entries intact.
4. Formulate strong, action-driven bullet points using Google's X-Y-Z formula ("Accomplished X as measured by Y by doing Z").
5. Ensure all required schema fields are populated accurately.
`;

  const response = await structuredLlm.invoke([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `CURRENT RESUME JSON:\n${JSON.stringify(
        currentJson,
        null,
        2
      )}\n\nUSER UPDATE REQUEST:\n${userUpdateInput}`,
    },
  ]);

  return response as ResumeJson;
}
