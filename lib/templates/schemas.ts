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
 * "Compact Photo CV" Custom Schema — matches Ali Rami's personal French CV
 * layout: photo header, three-column skills grid, work experience, personal
 * projects, education and a certifications grid. Distinct from the standard
 * schema because it adds `photoUrl`, `role`, social links, and a dedicated
 * `certifications` array with a `date` field (not `issueDate`/`issuer`).
 */
export const COMPACT_PHOTO_CV_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CompactPhotoCvSchema",
  type: "object",
  required: ["basics", "skills", "workExperience", "labels"],
  properties: {
    labels: {
      type: "object",
      description:
        "Section title text, in the resume's own language, so a translated language version also gets its own translated titles instead of hardcoded ones.",
      required: [
        "skills",
        "workExperience",
        "projects",
        "education",
        "certifications",
      ],
      properties: {
        skills: { type: "string", description: "e.g. 'Compétences techniques' / 'Technical Skills'" },
        workExperience: { type: "string", description: "e.g. 'Expériences professionnelles' / 'Work Experience'" },
        projects: { type: "string", description: "e.g. 'Projets personnels' / 'Personal Projects'" },
        education: { type: "string", description: "e.g. 'Formation' / 'Education'" },
        certifications: { type: "string", description: "e.g. 'Certifications'" },
      },
    },
    basics: {
      type: "object",
      required: ["fullName", "role", "email"],
      properties: {
        fullName: { type: "string", description: "Full name" },
        role: { type: "string", description: "Job title / role shown under the name" },
        photoUrl: { type: "string", description: "Profile photo URL, may be empty" },
        location: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        githubUrl: { type: "string" },
        linkedinUrl: { type: "string" },
        summary: { type: "string", description: "Short paragraph under the header contacts" },
      },
    },
    skills: {
      type: "array",
      description: "Skill columns, each with a label and grouped sub-categories",
      items: {
        type: "object",
        required: ["groups"],
        properties: {
          groups: {
            type: "array",
            items: {
              type: "object",
              required: ["label", "text"],
              properties: {
                label: { type: "string", description: "e.g. Langages, Frontend, Backend" },
                text: { type: "string", description: "Comma/bullet separated list of skills" },
              },
            },
          },
        },
      },
    },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        required: ["position", "company", "dateRange", "highlights"],
        properties: {
          position: { type: "string" },
          company: { type: "string" },
          dateRange: { type: "string", description: "Free-text date range, e.g. '11/2025 – 01/2026'" },
          highlights: { type: "array", items: { type: "string" } },
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
          stack: { type: "string", description: "Short tech-stack tag, e.g. 'Express.js • Laravel • Next.js'" },
          description: { type: "string" },
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        required: ["degree", "institution"],
        properties: {
          degree: { type: "string" },
          institution: { type: "string" },
          dateRange: { type: "string" },
        },
      },
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "issuer", "date"],
        properties: {
          name: { type: "string" },
          issuer: { type: "string" },
          date: { type: "string" },
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
