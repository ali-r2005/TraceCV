import { applyPatch, type Operation } from "fast-json-patch";
import { getChatModel } from "./chatModel";
import { ResumeSchema, JsonPatchSchema, type JsonPatchOperation } from "./schemas";

/**
 * Agent 2: Dynamic JSON Source-of-Truth Updater Agent
 *
 * Takes a natural language update alongside current JSON state, active
 * template's JSON schema, and selected AI modelId. Rather than having the
 * model re-emit the entire resume on every edit, it asks for a minimal
 * RFC 6902 JSON Patch (op/path/value) describing only what changed, applies
 * that patch locally, and returns the resulting full JSON object.
 */
export async function updateResumeJson(
  currentJson: Record<string, unknown>,
  userUpdateInput: string,
  customSchema?: Record<string, unknown> | null,
  modelId?: string
): Promise<Record<string, unknown>> {
  const llm = getChatModel({ modelId, temperature: 0 });

  const targetSchemaDescription =
    customSchema && typeof customSchema === "object" && Object.keys(customSchema).length > 0
      ? `TARGET JSON SCHEMA (the resume must conform to this):\n${JSON.stringify(customSchema, null, 2)}`
      : "TARGET JSON SCHEMA: the standard resume schema (basics, workExperience, education, skills, projects).";

  const systemPrompt = `
You are an expert AI Resume Editor.
You do NOT rewrite the whole resume. You return a minimal RFC 6902 JSON Patch
(a list of { op, path, value } operations) describing ONLY the fields that
need to change to satisfy the user's request.

${targetSchemaDescription}

RULES:
1. Parse the user's natural language update input.
2. Locate the exact JSON Pointer path(s) inside CURRENT RESUME JSON that need to change.
3. Use "add" to insert a new array item or new field, "replace" to overwrite an existing value, "remove" to delete one.
4. To append to an array, use "add" with path ending in "/-" (e.g. "/workExperience/-").
5. Do NOT include operations for fields that are not changing.
6. Formulate strong, action-driven bullet points using Google's X-Y-Z formula ("Accomplished X as measured by Y by doing Z") where applicable.
7. Every path MUST exist or be a valid insertion point in CURRENT RESUME JSON — do not invent unrelated structure.
`;

  const structuredLlm = llm.withStructuredOutput(JsonPatchSchema);

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

  const patchOps = response.patch as Operation[];
  console.log("AI-generated JSON Patch operations:", patchOps);
  if (!patchOps || patchOps.length === 0) {
    throw new Error("The AI did not return any changes to apply.");
  }

  const result = applyPatch(currentJson, patchOps, true, false);
  const updatedJson = result.newDocument as Record<string, unknown>;

  // Validate against the standard schema when no custom template schema overrides it.
  if (!customSchema || Object.keys(customSchema).length === 0) {
    const validated = ResumeSchema.safeParse(updatedJson);
    if (!validated.success) {
      throw new Error(
        `AI patch produced an invalid resume: ${validated.error.message}`
      );
    }
    return validated.data;
  }

  return updatedJson;
}

export type { JsonPatchOperation };
