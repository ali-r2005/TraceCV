import { z } from "zod";

/**
 * JSON Source of Truth schema — see architecture document section 4.
 * All AI resume updates MUST respect and maintain this exact structure.
 */

export const WorkExperienceItemSchema = z.object({
  id: z.string().optional(),
  company: z.string(),
  position: z.string(),
  startDate: z.string(),
  endDate: z.string().default("Present"),
  highlights: z
    .array(z.string())
    .describe("Action-oriented, quantifiable bullet points"),
  technologies: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const SkillGroupSchema = z.object({
  category: z.string(),
  keywords: z.array(z.string()),
});

export const ProjectItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().optional(),
  highlights: z.array(z.string()).default([]),
});

export const BasicsSchema = z.object({
  fullName: z.string(),
  headline: z.string().default(""),
  email: z.string(),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().default(""),
});

export const ResumeSchema = z.object({
  basics: BasicsSchema,
  workExperience: z.array(WorkExperienceItemSchema),
  education: z.array(EducationItemSchema).default([]),
  skills: z.array(SkillGroupSchema),
  projects: z.array(ProjectItemSchema).default([]),
});

export type ResumeJson = z.infer<typeof ResumeSchema>;
export type WorkExperienceItem = z.infer<typeof WorkExperienceItemSchema>;
export type EducationItem = z.infer<typeof EducationItemSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type ProjectItem = z.infer<typeof ProjectItemSchema>;

/** Empty skeleton used when creating a brand-new resume. */
export function emptyResumeJson(fullName: string, email: string): ResumeJson {
  return {
    basics: { fullName, headline: "", email, phone: "", location: "", summary: "" },
    workExperience: [],
    education: [],
    skills: [],
    projects: [],
  };
}

/**
 * Structured-output schema for Agent 1 (HTML Resume Template Generator).
 */
export const TemplateSchema = z.object({
  templateName: z.string(),
  htmlContent: z
    .string()
    .describe("HTML string containing Handlebars data bindings"),
  cssContent: z
    .string()
    .describe("CSS rules dedicated to styling the HTML output"),
});

export type GeneratedTemplate = z.infer<typeof TemplateSchema>;

/**
 * RFC 6902 JSON Patch schema used by Agent 2 to describe only the fields
 * that changed, rather than re-emitting the entire resume JSON on every
 * update. "value" is omitted for "remove" operations.
 */
export const JsonPatchOperationSchema = z.object({
  op: z
    .enum(["add", "remove", "replace"])
    .describe("JSON Patch operation type"),
  path: z
    .string()
    .describe(
      'JSON Pointer to the target field, e.g. "/workExperience/0/highlights/1"'
    ),
  value: z
    .any()
    .optional()
    .describe('New value for "add"/"replace". Omit for "remove".'),
});

export const JsonPatchSchema = z.object({
  patch: z
    .array(JsonPatchOperationSchema)
    .describe(
      "Minimal list of JSON Patch operations that fully applies the user's requested change. Do not include unchanged fields."
    ),
});

export type JsonPatchOperation = z.infer<typeof JsonPatchOperationSchema>;
