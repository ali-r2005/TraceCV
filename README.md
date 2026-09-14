# TraceCV — AI Resume Builder & Versioning Engine

An AI-assisted resume versioning and generation platform built on a **Single
Source of Truth (SSOT) JSON profile**, implementing the architecture
described in `AI Resume Builder & Versioning Engine — Conception &
Architecture Document.md`.

## Tech Stack

| Layer | Technology |
| :---- | :---- |
| Frontend | Next.js (App Router), Bootstrap 5 |
| Backend API | Next.js Route Handlers |
| Database | SQLite via Drizzle ORM (`better-sqlite3`) |
| AI Orchestration | LangChain (`@langchain/openai`), Zod schema validation |
| Render Engine | Handlebars.js |
| PDF Export | Puppeteer |

## Getting Started

1. Install dependencies (already installed if you're reading this after
   scaffolding):

   ```bash
   npm install
   ```

2. Copy the env example and add your OpenAI key (required for the two AI
   agents — template generation and resume updates):

   ```bash
   cp .env.local.example .env.local
   # then edit .env.local and set OPENAI_API_KEY
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The SQLite database
   is created automatically at `data/tracecv.sqlite` on first request.

4. (Optional, for PDF export) Puppeteer needs a downloaded Chromium binary:

   ```bash
   npx puppeteer browsers install chrome
   ```

   Without this, every other feature works; only `GET
   /api/resumes/:id/export` will return a clear error until the browser is
   installed.

## Project Structure

```
app/
  page.tsx                        Landing page
  resumes/page.tsx                Resume dashboard (list + create)
  resumes/[id]/page.tsx           Resume editor: live preview, AI update
                                   chat, version history, PDF export
  templates/page.tsx              Template management + AI generation
  api/resumes/route.ts            List / create resumes
  api/resumes/[id]/route.ts       Get / delete a resume
  api/resumes/[id]/update/route.ts     Agent 2 — natural language JSON update
  api/resumes/[id]/versions/...   Version history + rollback
  api/resumes/[id]/render/route.ts     Handlebars render → HTML preview
  api/resumes/[id]/export/route.ts     HTML → PDF export (Puppeteer)
  api/templates/route.ts          List / create templates
  api/templates/[id]/route.ts     Get / update / delete a template
  api/templates/generate/route.ts Agent 1 — AI template generation

lib/
  db/schema.ts        Drizzle schema (resumes, resume_versions, templates)
  db/client.ts         SQLite connection (better-sqlite3 + Drizzle)
  db/migrate.ts        Bootstraps tables (CREATE TABLE IF NOT EXISTS)
  ai/schemas.ts        Zod schema for the Resume JSON Source of Truth
  ai/templateAgent.ts        Agent 1: HTML Resume Template Generator
  ai/resumeUpdaterAgent.ts   Agent 2: JSON Source-of-Truth Updater
  render/renderResume.ts     Handlebars compile + render pipeline
  render/exportPdf.ts        Puppeteer HTML → PDF
  render/defaultTemplate.ts  Built-in fallback template
```

## How It Works

- Every resume has a `current_json` field holding the validated Resume
  JSON Source of Truth (basics, workExperience, education, skills,
  projects).
- **Agent 2** (`/api/resumes/:id/update`) takes a natural-language
  instruction (e.g. *"Add a 4-month Full Stack role at Acme using Laravel
  and React"*), merges it into the current JSON via a LangChain
  structured-output call enforced by a Zod schema, and only persists the
  result once it re-validates against that schema. Every successful update
  writes a new immutable row to `resume_versions`.
- Version history supports **rollback**: restoring an old snapshot creates
  a new version entry rather than deleting history.
- **Agent 1** (`/api/templates/generate`) takes a design prompt (e.g.
  *"Minimalist single-column layout with a dark header"*) and returns a
  Handlebars-templated HTML/CSS pair, stored in the `templates` table.
- The render pipeline combines a resume's JSON with any template's
  HTML/CSS through Handlebars to produce a live preview (`/render`) or a
  downloadable PDF (`/export`, via Puppeteer).

## Notes

- Both AI agents call OpenAI's `gpt-4o` model through LangChain's
  `withStructuredOutput`, which enforces the Zod schemas end-to-end rather
  than relying on best-effort text parsing.
- If `OPENAI_API_KEY` is not set, every non-AI feature (create/list/render
  resumes, manage templates, versioning, PDF export) still works; the two
  AI routes return a `502` with a descriptive error instead of crashing.
