# **AI Resume Builder & Versioning Engine — Software Conception Specification**

## ---

**1\. Project Vision & Architecture Overview**

This specification outlines the architecture for an automated, AI-assisted resume versioning and generation platform. The system operates on a **Single Source of Truth (SSOT) JSON profile** that tracks all career history, skills, and projects over time. The application is built using **Next.js** for rendering and API routes, **Bootstrap CSS** for UI styling, **SQLite** for lightweight local database persistence, and **LangChain** to orchestrate structured AI operations.

The core objective of the AI layer is to guarantee schema compliance. When updating career history or introducing HTML templates, AI models must produce strictly typed outputs matching pre-defined JSON schemas.

## **2\. System Architecture & Tech Stack**

| Layer | Technology Stack | Role & Responsibility |
| :---- | :---- | :---- |
| **Frontend** | Next.js (App Router), Bootstrap CSS 5 | UI components, form inputs, template management dashboards, resume version viewer, live HTML rendering. |
| **Backend API** | Next.js API Routes / Server Actions | Orchestrates LangChain agents, executes database queries, handles HTML template rendering. |
| **Database Layer** | SQLite (via Drizzle ORM) | Persists versioned JSON resume snapshots, HTML templates, execution logs, and user metadata. |
| **AI Orchestration** | LangChain, Zod Schema Validator | Executes structured LLM calls with enforced schema validation (JSON output parsing & HTML generation). |
| **Render Engine** | Handlebars.js / Native JS Template Engine | Injects the validated JSON payload into custom HTML/CSS templates for web preview and PDF export. |

## **3\. Database Schema (SQLite)**

The application relies on three core entities: resumes, resume\_versions, and templates.

`-- 1. Resumes (Core entity representing a user's master resume profile)`  
`CREATE TABLE resumes (`  
    `id TEXT PRIMARY KEY,`  
    `title TEXT NOT NULL,`  
    `current_json TEXT NOT NULL, -- Master JSON Source of Truth`  
    `created_at DATETIME DEFAULT CURRENT_TIMESTAMP,`  
    `updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`  
`);`

`-- 2. Resume Versions (Tracks history & AI modifications over time)`  
`CREATE TABLE resume_versions (`  
    `id TEXT PRIMARY KEY,`  
    `resume_id TEXT NOT NULL,`  
    `version_number INTEGER NOT NULL,`  
    `change_summary TEXT NOT NULL, -- e.g., "Added Senior Full Stack role at Acme Corp"`  
    `snapshot_json TEXT NOT NULL,  -- Validated JSON state at this specific version`  
    `created_at DATETIME DEFAULT CURRENT_TIMESTAMP,`  
    `FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE`  
`);`

`-- 3. Templates (Stores custom HTML/CSS templates for rendering)`  
`CREATE TABLE templates (`  
    `id TEXT PRIMARY KEY,`  
    `name TEXT NOT NULL,`  
    `description TEXT,`  
    `html_content TEXT NOT NULL, -- HTML containing placeholders (Handlebars-compatible)`  
    `css_content TEXT NOT NULL,  -- Embedded custom CSS`  
    `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`  
`);`

## **4\. JSON Source of Truth Schema (Schema Definition)**

All AI resume updates MUST respect and maintain this exact JSON structure. The AI agent must never drop existing items unless explicitly instructed, and must always append new experiences or skills according to this schema.

`{`  
  `"$schema": "http://json-schema.org/draft-07/schema#",`  
  `"title": "ResumeSourceOfTruth",`  
  `"type": "object",`  
  `"properties": {`  
    `"basics": {`  
      `"type": "object",`  
      `"properties": {`  
        `"fullName": { "type": "string" },`  
        `"headline": { "type": "string" },`  
        `"email": { "type": "string" },`  
        `"phone": { "type": "string" },`  
        `"location": { "type": "string" },`  
        `"summary": { "type": "string" }`  
      `},`  
      `"required": ["fullName", "email"]`  
    `},`  
    `"workExperience": {`  
      `"type": "array",`  
      `"items": {`  
        `"type": "object",`  
        `"properties": {`  
          `"id": { "type": "string" },`  
          `"company": { "type": "string" },`  
          `"position": { "type": "string" },`  
          `"startDate": { "type": "string" },`  
          `"endDate": { "type": "string" },`  
          `"highlights": {`  
            `"type": "array",`  
            `"items": { "type": "string" }`  
          `},`  
          `"technologies": {`  
            `"type": "array",`  
            `"items": { "type": "string" }`  
          `}`  
        `},`  
        `"required": ["company", "position", "startDate", "highlights"]`  
      `}`  
    `},`  
    `"education": {`  
      `"type": "array",`  
      `"items": {`  
        `"type": "object",`  
        `"properties": {`  
          `"institution": { "type": "string" },`  
          `"degree": { "type": "string" },`  
          `"fieldOfStudy": { "type": "string" },`  
          `"startDate": { "type": "string" },`  
          `"endDate": { "type": "string" }`  
        `},`  
        `"required": ["institution", "degree"]`  
      `}`  
    `},`  
    `"skills": {`  
      `"type": "array",`  
      `"items": {`  
        `"type": "object",`  
        `"properties": {`  
          `"category": { "type": "string" },`  
          `"keywords": {`  
            `"type": "array",`  
            `"items": { "type": "string" }`  
          `}`  
        `},`  
        `"required": ["category", "keywords"]`  
      `}`  
    `},`  
    `"projects": {`  
      `"type": "array",`  
      `"items": {`  
        `"type": "object",`  
        `"properties": {`  
          `"title": { "type": "string" },`  
          `"description": { "type": "string" },`  
          `"url": { "type": "string" },`  
          `"highlights": {`  
            `"type": "array",`  
            `"items": { "type": "string" }`  
          `}`  
        `},`  
        `"required": ["title", "description"]`  
      `}`  
    `}`  
  `},`  
  `"required": ["basics", "workExperience", "skills"]`  
`}`

## **5\. Agentic AI Pipeline Design (LangChain Integration)**

### **Agent 1: HTML Resume Template Generator Agent**

**Role:** Converts raw designs, layouts, or user styling requirements into clean, responsive HTML/CSS templates designed for data binding.

**LangChain Implementation Strategy:** Uses ChatOpenAI or ChatAnthropic with structured output enforcement to return valid HTML string structures containing Handlebars placeholders (e.g., {{basics.fullName}}, {{\#each workExperience}}).

`import { ChatOpenAI } from "@langchain/openai";`  
`import { PromptTemplate } from "@langchain/core/prompts";`  
`import { StructuredOutputParser } from "langchain/output_parsers";`  
`import { z } from "zod";`

`const templateSchema = z.object({`  
  `templateName: z.string(),`  
  `htmlContent: z.string().describe("HTML string containing Handlebars data bindings"),`  
  `cssContent: z.string().describe("CSS rules dedicated to styling the HTML output")`  
`});`

`export async function generateResumeTemplate(userDesignPrompt: string) {`  
  `const model = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.2 });`  
  `const parser = StructuredOutputParser.fromZodSchema(templateSchema);`

  `` const prompt = PromptTemplate.fromTemplate(` ``  
    `You are an expert UI/UX developer specialized in HTML/CSS resume printing templates.`  
    `Generate a complete, modern HTML template based on the following instructions:`  
    `{userDesignPrompt}`

    `CRITICAL RULES:`  
    `1. HTML must bind parameters from this exact JSON schema:`  
       `- {{basics.fullName}}, {{basics.email}}, {{basics.summary}}`  
       `- Loop arrays using Handlebars format: {{#each workExperience}} ... {{/each}}`  
    `2. Do NOT write JavaScript inside HTML.`  
    `3. Return ONLY valid structured output matching the format instructions.`

    `{formatInstructions}`  
  `` `); ``

  `const input = await prompt.format({`  
    `userDesignPrompt,`  
    `formatInstructions: parser.getFormatInstructions()`  
  `});`

  `const response = await model.invoke(input);`  
  `return await parser.parse(response.content as string);`  
`}`

### **Agent 2: JSON Source-of-Truth Updater Agent**

**Role:** Takes natural language updates (e.g., *"I just finished a 4-month role as a Full Stack Software Engineer working on microservices using Laravel and React"*) alongside the current JSON state, appends/modifies the relevant array items, and returns the full updated JSON without violating the schema.

`import { ChatOpenAI } from "@langchain/openai";`  
`import { z } from "zod";`

`const WorkExperienceItemSchema = z.object({`  
  `id: z.string().optional(),`  
  `company: z.string(),`  
  `position: z.string(),`  
  `startDate: z.string(),`  
  `endDate: z.string().default("Present"),`  
  `highlights: z.array(z.string()).describe("Action-oriented, quantifiable bullet points"),`  
  `technologies: z.array(z.string())`  
`});`

`const ResumeSchema = z.object({`  
  `basics: z.object({`  
    `fullName: z.string(),`  
    `headline: z.string(),`  
    `email: z.string(),`  
    `phone: z.string().optional(),`  
    `location: z.string().optional(),`  
    `summary: z.string()`  
  `}),`  
  `workExperience: z.array(WorkExperienceItemSchema),`  
  `education: z.array(z.object({`  
    `institution: z.string(),`  
    `degree: z.string(),`  
    `fieldOfStudy: z.string().optional(),`  
    `startDate: z.string(),`  
    `endDate: z.string().optional()`  
  `})),`  
  `skills: z.array(z.object({`  
    `category: z.string(),`  
    `keywords: z.array(z.string())`  
  `})),`  
  `projects: z.array(z.object({`  
    `title: z.string(),`  
    `description: z.string(),`  
    `url: z.string().optional(),`  
    `highlights: z.array(z.string())`  
  `})).optional()`  
`});`

`export async function updateResumeJson(currentJson: object, userUpdateInput: string) {`  
  `const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0 });`  
  `const structuredLlm = llm.withStructuredOutput(ResumeSchema);`

  `` const systemPrompt = ` ``  
    `You are an expert AI Resume Editor.`  
    `Your objective is to update the user's JSON Resume Source of Truth while strictly maintaining structure.`

    `RULES:`  
    `1. Parse the user's natural language update input.`  
    `2. Identify target section (e.g., adding an entry to "workExperience", appending "skills").`  
    `3. Append the new item inside the appropriate array while leaving pre-existing entries intact.`  
    `4. Formulate strong, action-driven bullet points using Google's X-Y-Z formula ("Accomplished X as measured by Y by doing Z").`  
    `5. Ensure all required schema fields are populated accurately.`  
  `` `; ``

  `const response = await structuredLlm.invoke([`  
    `{ role: "system", content: systemPrompt },`  
    ``{ role: "user", content: `CURRENT RESUME JSON:\n${JSON.stringify(currentJson, null, 2)}\n\nUSER UPDATE REQUEST:\n${userUpdateInput}` }``  
  `]);`

  `return response;`  
`}`

## **6\. Agent Execution Guide & Step-by-Step Implementation**

1. **Setup Next.js & Bootstrap:** Initialize a Next.js App Router application and load Bootstrap 5 via standard package managers or CDN scripts in layout.tsx.  
2. **Setup SQLite Database:** Initialize SQLite and create the migration scripts using Prisma or Drizzle to establish resumes, resume\_versions, and templates tables.  
3. **Implement Template Render Pipeline:** Create an API utility using Handlebars to combine the SQLite snapshot\_json with an HTML template string to render a live HTML resume preview.  
4. **Deploy Agent 1 (Template Generator):** Expose a Next.js Server Action where users prompt for resume layouts (e.g., "Minimalist single-column header"), executing Agent 1 to store returned HTML/CSS in SQLite.  
5. **Deploy Agent 2 (JSON Updater):** Build a natural language prompt interface (e.g., "Add my latest microservices project"). Send current JSON payload \+ prompt to Agent 2, validate schema with Zod, update SQLite current\_json, and write a new snapshot entry to resume\_versions.  
6. **Export Pipeline:** Integrate standard HTML-to-PDF engine libraries (e.g., Puppeteer) to convert rendered Handlebars HTML views into downloadable PDFs.