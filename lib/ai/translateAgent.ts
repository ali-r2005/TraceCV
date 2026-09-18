import type { Operation } from "fast-json-patch";
import { getChatModel } from "./chatModel";
import { ResumeSchema, JsonPatchSchema, type ResumeJson } from "./schemas";

/**
 * Agent 3: Resume Translator
 *
 * Translates every human-readable string field of a resume JSON into the
 * target language, while leaving structural fields (dates, URLs, email,
 * technology/keyword names) untouched. Used when the user adds a new
 * language version of an existing resume.
 */
export async function translateResumeJson(
  sourceJson: Record<string, unknown>,
  targetLanguage: string,
  modelId?: string
): Promise<ResumeJson> {
  const llm = await getChatModel({ modelId, temperature: 0 });
  const structuredLlm = llm.withStructuredOutput(ResumeSchema);

  const systemPrompt = `
You are an expert professional resume translator.
Translate the RESUME JSON below into ${targetLanguage}.

RULES:
1. Translate all human-readable text: headline, summary, position titles,
   highlights/bullet points, degree names, field of study, project
   descriptions, skill category names.
2. Do NOT translate: email addresses, URLs, dates, company names, person
   names, or specific technology/tool names (e.g. "React", "PostgreSQL").
3. Preserve the exact JSON structure — same fields, same array lengths and order.
4. Keep the translation natural and professional, as a native ${targetLanguage}
   speaker would write on their own resume.
`;

  const response = await structuredLlm.invoke([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `RESUME JSON:\n${JSON.stringify(sourceJson, null, 2)}`,
    },
  ]);

  return response as ResumeJson;
}

/**
 * Translates only the "value" fields of a JSON Patch into the target
 * language, leaving every "op" and "path" untouched. Used to sync a
 * translated resume with edits made on its source-language sibling without
 * re-translating content that hasn't changed.
 */
export async function translateJsonPatch(
  patch: Operation[],
  targetLanguage: string,
  modelId?: string
): Promise<Operation[]> {
  const llm = await getChatModel({ modelId, temperature: 0 });
  const structuredLlm = llm.withStructuredOutput(JsonPatchSchema);

  const systemPrompt = `
You are an expert professional resume translator.
You will receive an RFC 6902 JSON Patch (a list of { op, path, value } operations)
describing edits made to a resume in its original language.

Return the SAME patch, translated into ${targetLanguage}:
1. Keep every "op" and "path" EXACTLY unchanged.
2. For "add"/"replace" operations, translate the "value" into ${targetLanguage}
   if it is human-readable text (titles, descriptions, bullet points, names of
   sections). Do NOT translate emails, URLs, dates, company names, person
   names, or specific technology/tool names.
3. If "value" is an object or array, translate only its human-readable string
   fields inside, keeping the same shape.
4. For "remove" operations, omit "value" entirely.
5. Do not add, remove, or reorder operations — return exactly one output
   operation per input operation, in the same order.
`;

  const response = await structuredLlm.invoke([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `JSON PATCH TO TRANSLATE:\n${JSON.stringify(patch, null, 2)}`,
    },
  ]);

  return response.patch as Operation[];
}
