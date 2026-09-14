/**
 * Standard Resume JSON Schema (Draft-07 compliant)
 */
export const STANDARD_RESUME_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "StandardResumeSchema",
  type: "object",
  required: ["basics", "workExperience", "skills"],
  properties: {
    basics: {
      type: "object",
      required: ["fullName", "email"],
      properties: {
        fullName: { type: "string", description: "Full legal or professional name" },
        headline: { type: "string", description: "Job title or professional headline" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        location: { type: "string", description: "City, Country or State" },
        summary: { type: "string", description: "Professional summary statement" },
      },
    },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        required: ["company", "position", "startDate"],
        properties: {
          company: { type: "string" },
          position: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string", default: "Present" },
          highlights: {
            type: "array",
            items: { type: "string" },
            description: "Action-oriented achievement bullet points",
          },
          technologies: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        required: ["institution", "degree"],
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          fieldOfStudy: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
      },
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        required: ["category", "keywords"],
        properties: {
          category: { type: "string", description: "Skill group name (e.g. Languages, Frameworks)" },
          keywords: { type: "array", items: { type: "string" } },
        },
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "description"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          url: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

/**
 * Specialized Tech & Certifications Resume Schema
 */
export const TECH_CERTIFICATIONS_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "TechEngineeringResumeSchema",
  type: "object",
  required: ["basics", "workExperience", "skills", "certifications"],
  properties: {
    basics: {
      type: "object",
      required: ["fullName", "email", "githubUrl"],
      properties: {
        fullName: { type: "string" },
        headline: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        githubUrl: { type: "string", description: "GitHub profile or portfolio URL" },
        linkedinUrl: { type: "string", description: "LinkedIn profile URL" },
        summary: { type: "string" },
      },
    },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        required: ["company", "position", "startDate", "highlights"],
        properties: {
          company: { type: "string" },
          position: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string", default: "Present" },
          highlights: { type: "array", items: { type: "string" } },
          technologies: { type: "array", items: { type: "string" } },
        },
      },
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        required: ["category", "keywords"],
        properties: {
          category: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
        },
      },
    },
    certifications: {
      type: "array",
      description: "Industry licenses and verified technical certifications",
      items: {
        type: "object",
        required: ["name", "issuer", "issueDate"],
        properties: {
          name: { type: "string" },
          issuer: { type: "string", description: "e.g. AWS, Google Cloud, Microsoft" },
          issueDate: { type: "string" },
          credentialUrl: { type: "string" },
        },
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "description"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          url: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        required: ["institution", "degree"],
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          fieldOfStudy: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
      },
    },
  },
};
