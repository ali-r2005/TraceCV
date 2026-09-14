import { getChatModel } from "./chatModel";
import { ResumeSchema, type ResumeJson } from "./schemas";

/**
 * Agent 2: JSON Source-of-Truth Updater Agent
 *
 * Takes a natural language update alongside the current JSON state, appends
 * or modifies the relevant array items, and returns the full updated JSON
 * without violating the schema (see architecture document section 5, Agent 2).
 */
export async function updateResumeJson(
  currentJson: ResumeJson,
  userUpdateInput: string
): Promise<ResumeJson> {
  const llm = getChatModel(0);
  const structuredLlm = llm.withStructuredOutput(ResumeSchema);

  const systemPrompt = `
You are an expert AI Resume Editor.
Your objective is to update the user's JSON Resume Source of Truth while strictly maintaining structure.

RULES:
1. Parse the user's natural language update input.
2. Identify target section (e.g., adding an entry to "workExperience", appending "skills").
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
