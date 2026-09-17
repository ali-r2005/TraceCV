import { applyPatch, type Operation } from "fast-json-patch";
import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import { getChatModel } from "./chatModel";
import { ResumeSchema, JsonPatchSchema, type JsonPatchOperation } from "./schemas";

const ajv = new Ajv({ allErrors: true, strict: false });

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return "Unknown validation error.";
  return errors
    .map((e) => `- ${e.instancePath || "/"} ${e.message}`)
    .join("\n");
}

const MAX_ATTEMPTS = 2;

/**
 * Agent 2: Dynamic JSON Source-of-Truth Updater Agent
 *
 * Takes a natural language update alongside current JSON state, active
 * template's JSON schema, and selected AI modelId. Rather than having the
 * model re-emit the entire resume on every edit, it asks for a minimal
 * RFC 6902 JSON Patch (op/path/value) describing only what changed, applies
 * that patch locally, and returns the resulting full JSON object.
 *
 * When a custom template schema is supplied, the resulting JSON is validated
 * against it with Ajv (real JSON Schema enforcement, not just prompt text).
 * On a validation failure the model gets one retry with the exact errors so
 * it can correct its own patch before we give up.
 */
export async function updateResumeJson(
  currentJson: Record<string, unknown>,
  userUpdateInput: string,
  customSchema?: Record<string, unknown> | null,
  modelId?: string
): Promise<Record<string, unknown>> {
  const llm = getChatModel({ modelId, temperature: 0 });
  const hasCustomSchema = !!customSchema && typeof customSchema === "object" && Object.keys(customSchema).length > 0;

  let validateCustom: ValidateFunction | null = null;
  if (hasCustomSchema) {
    try {
      validateCustom = ajv.compile(customSchema as Record<string, unknown>);
    } catch (err) {
      throw new Error(
        `This template's custom schema is not a valid JSON Schema and cannot be enforced: ${err}`
      );
    }
  }

  const targetSchemaDescription = hasCustomSchema
    ? `TARGET JSON SCHEMA (the resume must conform to this):\n${JSON.stringify(customSchema, null, 2)}`
    : "TARGET JSON SCHEMA: the standard resume schema (basics, workExperience, education, skills, projects).";

  const baseSystemPrompt = `
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

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const systemPrompt =
      attempt === 1
        ? baseSystemPrompt
        : `${baseSystemPrompt}\nYOUR PREVIOUS PATCH FAILED SCHEMA VALIDATION WITH THESE ERRORS:\n${lastError}\nFix your patch so the resulting JSON satisfies the TARGET JSON SCHEMA exactly.`;

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
    if (!patchOps || patchOps.length === 0) {
      throw new Error("The AI did not return any changes to apply.");
    }

    let updatedJson: Record<string, unknown>;
    try {
      const result = applyPatch(currentJson, patchOps, true, false);
      updatedJson = result.newDocument as Record<string, unknown>;
    } catch (err) {
      lastError = `The patch could not be applied to the current resume JSON: ${err}`;
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(lastError);
      }
      continue;
    }

    if (!hasCustomSchema) {
      const validated = ResumeSchema.safeParse(updatedJson);
      if (!validated.success) {
        lastError = validated.error.message;
        if (attempt === MAX_ATTEMPTS) {
          throw new Error(`AI patch produced an invalid resume: ${lastError}`);
        }
        continue;
      }
      return validated.data;
    }

    if (validateCustom && !validateCustom(updatedJson)) {
      lastError = formatAjvErrors(validateCustom.errors);
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(`AI patch produced a resume that does not match this template's custom schema:\n${lastError}`);
      }
      continue;
    }

    return updatedJson;
  }

  throw new Error("Failed to produce a valid resume update.");
}

export type { JsonPatchOperation };
