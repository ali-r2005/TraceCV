import { randomUUID } from "crypto";
import { sqlite } from "./client";
import {
  DEFAULT_TEMPLATE_HTML,
  DEFAULT_TEMPLATE_CSS,
} from "../render/defaultTemplate";
import {
  COMPACT_PHOTO_CV_HTML,
  COMPACT_PHOTO_CV_CSS,
} from "../render/compactPhotoTemplate";
import {
  STANDARD_RESUME_JSON_SCHEMA,
  TECH_CERTIFICATIONS_JSON_SCHEMA,
  COMPACT_PHOTO_CV_JSON_SCHEMA,
} from "../templates/schemas";

export {
  STANDARD_RESUME_JSON_SCHEMA,
  TECH_CERTIFICATIONS_JSON_SCHEMA,
  COMPACT_PHOTO_CV_JSON_SCHEMA,
};

const COMPACT_PHOTO_CV_TEMPLATE_ID = "tpl-compact-photo-cv";

/** Ali Rami's real CV content, mapped to COMPACT_PHOTO_CV_JSON_SCHEMA. */
const ALI_RAMI_RESUME_JSON = {
  labels: {
    skills: "Compétences techniques",
    workExperience: "Expériences professionnelles",
    projects: "Projets personnels",
    education: "Formation",
    certifications: "Certifications",
  },
  basics: {
    fullName: "Ali Rami",
    role: "Développeur Full-Stack",
    photoUrl: "https://i.pravatar.cc/300?img=13",
    location: "Tanger / Casablanca, Maroc",
    phone: "0772777815",
    email: "ali.rami.6699@gmail.com",
    githubUrl: "https://github.com/ali-r2005",
    linkedinUrl: "https://www.linkedin.com/in/ali-rami-63a998338/",
    summary:
      "Développeur Full-Stack avec une expérience concrète en développement d'applications web, APIs et workflows automatisés en production. À l'aise avec React, Astro, Cloudflare Workers et architectures backend modernes. Habitué à travailler en autonomie sur des projets end-to-end, avec un fort focus performance, SEO et fiabilité.",
  },
  skills: [
    {
      groups: [
        { label: "Langages", text: "JavaScript • TypeScript • Python • Go • PHP • SQL • Java" },
        { label: "Frontend", text: "React • Next.js • SvelteKit • Tailwind CSS • Chart.js • shadcn • Astro" },
        { label: "Mobile", text: "React Native (Expo)" },
      ],
    },
    {
      groups: [
        { label: "Backend", text: "NestJS • Express • Laravel • Flask • Gin (Go) • Prisma • Hono • Cloudflare Workers" },
        { label: "DB", text: "PostgreSQL • MySQL • MongoDB • Cloudflare D1" },
        { label: "Déploiement", text: "Cloudflare Pages & Workers • Vercel" },
      ],
    },
    {
      groups: [
        { label: "Outils", text: "Docker • Git • RabbitMQ • SSE • Agile • Figma" },
        { label: "IA", text: "LangChain • OpenAI • YOLO • OpenCV" },
      ],
    },
  ],
  workExperience: [
    {
      position: "Développeur Full-Stack & Mobile",
      company: "Hostino — Tanger",
      dateRange: "11/2025 – 01/2026",
      highlights: [
        "Développement et déploiement d'applications web et APIs en production avec React, Astro et Cloudflare Pages/Workers",
        "Conception et implémentation d'APIs REST sécurisées avec des mécanismes avancés comme rate limiting et API keys, ainsi que des règles WAF Cloudflare pour la réduction des attaques DDoS et des bots automatisés, renforçant la résilience de l'infrastructure en production",
        "Mise en place de workflows automatisés basés sur webhooks (WHMCS → Zoho Books)",
        "Développement d'un dashboard React pour le suivi des invoices (statuts, actions) avec intégration email via Brevo",
        "Conception et développement d'une application mobile de type client email avec React Native (Expo), connectée aux APIs backend.",
        "Optimisation des performances et du SEO via SSG / SSR avec Astro et déploiement sur Cloudflare Pages/Workers",
        "Optimisation des performances d'une application web grâce au lazy loading des images et à la réduction des bundles JavaScript, augmentant le score Lighthouse de 70 à 95 et réduisant significativement le temps de chargement initial",
        "Conception d'un boilerplate Astro avec configuration SEO optimisée (meta tags, sitemap, structured data), réduisant de 70 % le temps de mise en place de nouveaux projets web.",
        "Travail en autonomie complète sur des fonctionnalités end-to-end, du design au déploiement",
      ],
    },
    {
      position: "Développeur Full-Stack",
      company: "Centric Marketing — Tanger",
      dateRange: "07/2025 – 10/2025",
      highlights: [
        "Participation au développement d'une plateforme d'Email Marketing en architecture microservices (Next.js, NestJS, Go, RabbitMQ)",
        "Développement d'interfaces de gestion de campagnes, avec mise à jour en temps réel via Server-Sent Events (SSE)",
        "Développement d'APIs REST scalables avec NestJS, Prisma et PostgreSQL avec logique multi-tenant",
        "Implémentation de communication asynchrone entre microservices via RabbitMQ, incluant des services backend en Go (Gin)",
        "Optimisation des performances : implémentation du lazy loading, gestion d'état via Zustand et sécurisation des flux asynchrones entre microservices.",
      ],
    },
    {
      position: "Stagiaire Générateur Graphiques IA",
      company: "Datatika — Tanger",
      dateRange: "05/2025",
      highlights: [
        "Générateur de graphiques IA (Next.js + TypeScript)",
        "Intégration OpenAI & LangChain (suggestions KPIs, génération automatique de requêtes SQL)",
        "APIs pour créer/sauvegarder/afficher des graphiques avec Chart.js",
      ],
    },
    {
      position: "Stagiaire Frontend",
      company: "System Base — Tanger",
      dateRange: "08/2024 – 09/2024",
      highlights: [
        "Amélioration du portail d'emploi (SvelteKit + Tailwind CSS)",
        "Implémentation des fonctionnalités CRUD profils et questionnaires avec intégration APIs et création de composants réutilisables",
      ],
    },
  ],
  projects: [
    {
      title: "Waitless",
      stack: "Express.js • Laravel • Next.js • SSE",
      description:
        "Microservices de gestion de files d'attente avec estimation du temps d'attente et mises à jour SSE.",
    },
    {
      title: "Plateforme Réservation",
      stack: "Flask • MySQL • Jinja2",
      description:
        "Application web de réservation avec workflow complet (création, consultation, réservation).",
    },
    {
      title: "Dofus Bot",
      stack: "Python • OpenCV • OCR • PyWin32",
      description: "Automatisation d'actions via vision et OCR.",
    },
  ],
  education: [
    {
      degree: "Licence Génie Informatique",
      institution: "École High Tech",
      dateRange: "2025 – Présent",
    },
    {
      degree: "Technicien Spécialisé Développement Digital",
      institution: "ISTA NTIC Tanger",
      dateRange: "2023–2025",
    },
    {
      degree: "Bac Sciences Physiques (Option Française)",
      institution: "",
      dateRange: "2023",
    },
  ],
  certifications: [
    { name: "Prompting Essentials", issuer: "Google", date: "Juin 2025" },
    { name: "JavaScript", issuer: "Meta", date: "Juillet 2024" },
    { name: "React Basics", issuer: "Meta", date: "Déc. 2024" },
    { name: "Laravel & PHP", issuer: "Board Infinity", date: "Fév. 2025" },
  ],
};

/**
 * Seeds the "Compact Photo CV" template (matching Ali Rami's real French CV
 * design) plus a resume pre-filled with its content, so there's real data to
 * keep iterating on. Runs independently of seedDefaultTemplates() and is a
 * no-op once the template row already exists — never overwrites existing
 * templates/resumes.
 */
export function seedCompactPhotoCv() {
  const existing = sqlite
    .prepare("SELECT id FROM templates WHERE id = ?")
    .get(COMPACT_PHOTO_CV_TEMPLATE_ID);
  if (existing) return;

  sqlite
    .prepare(
      `INSERT INTO templates (id, name, description, html_content, css_content, schema_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      COMPACT_PHOTO_CV_TEMPLATE_ID,
      "Compact Photo CV",
      "Compact A4 CV with photo header, three-column skills, and a certifications grid.",
      COMPACT_PHOTO_CV_HTML,
      COMPACT_PHOTO_CV_CSS,
      JSON.stringify(COMPACT_PHOTO_CV_JSON_SCHEMA, null, 2)
    );

  const resumeId = randomUUID();
  sqlite
    .prepare(
      `INSERT INTO resumes (id, title, template_id, current_json, resume_group_id, language, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
    .run(
      resumeId,
      "Ali Rami — CV",
      COMPACT_PHOTO_CV_TEMPLATE_ID,
      JSON.stringify(ALI_RAMI_RESUME_JSON),
      resumeId,
      "fr"
    );
}

const TECH_TEMPLATE_HTML = `
<div class="tech-resume">
  <header class="header">
    <div class="header-main">
      <h1>{{basics.fullName}}</h1>
      <div class="badge-role">{{basics.headline}}</div>
    </div>
    <div class="header-contact">
      <div><span>✉</span> {{basics.email}}</div>
      {{#if basics.phone}}<div><span>✆</span> {{basics.phone}}</div>{{/if}}
      {{#if basics.location}}<div><span>⚲</span> {{basics.location}}</div>{{/if}}
      {{#if basics.githubUrl}}<div><span>⌥</span> <a href="{{basics.githubUrl}}">GitHub</a></div>{{/if}}
      {{#if basics.linkedinUrl}}<div><span>in</span> <a href="{{basics.linkedinUrl}}">LinkedIn</a></div>{{/if}}
    </div>
  </header>

  {{#if basics.summary}}
  <div class="summary-box">
    {{basics.summary}}
  </div>
  {{/if}}

  {{#if workExperience.length}}
  <section class="section">
    <h2 class="sec-title"><span>01.</span> Professional Experience</h2>
    {{#each workExperience}}
    <div class="job-card">
      <div class="job-header">
        <span class="role">{{position}}</span>
        <span class="company">@ {{company}}</span>
        <span class="timeline">{{dateRange startDate endDate}}</span>
      </div>
      {{#if highlights.length}}
      <ul class="bullets">
        {{#each highlights}}<li>{{this}}</li>{{/each}}
      </ul>
      {{/if}}
      {{#if technologies.length}}
      <div class="tech-tags">
        {{#each technologies}}<span class="tag">{{this}}</span>{{/each}}
      </div>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if certifications.length}}
  <section class="section">
    <h2 class="sec-title"><span>02.</span> Certifications & Credentials</h2>
    <div class="certs-grid">
      {{#each certifications}}
      <div class="cert-item">
        <strong>{{name}}</strong> — <span class="issuer">{{issuer}}</span> ({{issueDate}})
        {{#if credentialUrl}}<a class="cert-link" href="{{credentialUrl}}">Verify ↗</a>{{/if}}
      </div>
      {{/each}}
    </div>
  </section>
  {{/if}}

  {{#if skills.length}}
  <section class="section">
    <h2 class="sec-title"><span>03.</span> Core Stack & Skills</h2>
    {{#each skills}}
    <div class="skill-row">
      <strong class="skill-cat">{{category}}:</strong>
      <span class="skill-list">{{join keywords " • "}}</span>
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if projects.length}}
  <section class="section">
    <h2 class="sec-title"><span>04.</span> Technical Projects</h2>
    {{#each projects}}
    <div class="project-item">
      <div class="proj-head">
        <strong>{{title}}</strong>
        {{#if url}}<a href="{{url}}">{{url}}</a>{{/if}}
      </div>
      <p>{{description}}</p>
      {{#if highlights.length}}
      <ul class="bullets">
        {{#each highlights}}<li>{{this}}</li>{{/each}}
      </ul>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if education.length}}
  <section class="section">
    <h2 class="sec-title"><span>05.</span> Education</h2>
    {{#each education}}
    <div class="edu-item">
      <strong>{{degree}}{{#if fieldOfStudy}}, {{fieldOfStudy}}{{/if}}</strong> — {{institution}}
      <span class="dates">{{dateRange startDate endDate}}</span>
    </div>
    {{/each}}
  </section>
  {{/if}}
</div>
`.trim();

const TECH_TEMPLATE_CSS = `
body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 2rem; line-height: 1.5; }
.tech-resume { max-width: 840px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 1.25rem; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
.header h1 { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
.badge-role { display: inline-block; background: #e0f2fe; color: #0369a1; font-weight: 600; font-size: 0.9rem; padding: 0.2rem 0.6rem; border-radius: 4px; }
.header-contact { font-size: 0.85rem; color: #475569; display: flex; flex-direction: column; gap: 0.2rem; text-align: right; }
.header-contact a { color: #0284c7; text-decoration: none; }
.summary-box { background: #f8fafc; border-left: 4px solid #0284c7; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.95rem; color: #334155; }
.section { margin-bottom: 1.5rem; }
.sec-title { font-size: 1.05rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.35rem; margin-bottom: 0.85rem; }
.sec-title span { color: #0284c7; margin-right: 0.25rem; }
.job-card, .project-item { margin-bottom: 1rem; }
.job-header, .proj-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; }
.role { font-weight: 700; color: #0f172a; font-size: 1rem; }
.company { color: #0284c7; font-weight: 600; }
.timeline, .dates { color: #64748b; font-size: 0.85rem; }
.bullets { margin: 0.4rem 0 0; padding-left: 1.25rem; }
.bullets li { margin-bottom: 0.25rem; font-size: 0.92rem; color: #334155; }
.tech-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.4rem; }
.tag { background: #f1f5f9; color: #475569; font-size: 0.75rem; font-family: monospace; padding: 0.15rem 0.45rem; border-radius: 3px; border: 1px solid #e2e8f0; }
.certs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0.5rem; }
.cert-item { background: #f8fafc; padding: 0.5rem 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 0.9rem; }
.issuer { color: #0284c7; font-weight: 600; }
.cert-link { margin-left: 0.5rem; color: #0284c7; font-size: 0.8rem; text-decoration: none; }
.skill-row { margin-bottom: 0.4rem; font-size: 0.92rem; }
.skill-cat { color: #0f172a; display: inline-block; min-width: 140px; }
.skill-list { color: #475569; }
`.trim();

/**
 * Seeds initial templates if none exist in the database.
 */
export function seedDefaultTemplates() {
  const rowCount = sqlite
    .prepare("SELECT count(*) as count FROM templates")
    .get() as { count: number };

  if (rowCount.count === 0) {
    const insert = sqlite.prepare(`
      INSERT INTO templates (id, name, description, html_content, css_content, schema_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    // 1. Standard Modern Template
    insert.run(
      "tpl-modern-standard",
      "Modern Classic (Standard SSOT)",
      "Clean, versatile corporate single-column resume matching the master standard schema.",
      DEFAULT_TEMPLATE_HTML,
      DEFAULT_TEMPLATE_CSS,
      JSON.stringify(STANDARD_RESUME_JSON_SCHEMA, null, 2)
    );

    // 2. Tech & Engineering Template with Certifications
    insert.run(
      "tpl-tech-certifications",
      "Engineering & Cloud Architect (With Certifications)",
      "Specialized technical layout with custom fields for cloud certifications, GitHub handles, and tech tags.",
      TECH_TEMPLATE_HTML,
      TECH_TEMPLATE_CSS,
      JSON.stringify(TECH_CERTIFICATIONS_JSON_SCHEMA, null, 2)
    );
  }
}
