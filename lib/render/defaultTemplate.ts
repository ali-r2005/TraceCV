/**
 * Default seed template used when a resume has no template selected yet.
 * Handlebars placeholders bind directly to the Resume JSON Source of Truth.
 */
export const DEFAULT_TEMPLATE_HTML = `
<div class="resume">
  <header class="resume-header">
    <h1>{{basics.fullName}}</h1>
    <p class="headline">{{basics.headline}}</p>
    <p class="contact">
      {{basics.email}}{{#if basics.phone}} &middot; {{basics.phone}}{{/if}}{{#if basics.location}} &middot; {{basics.location}}{{/if}}
    </p>
    {{#if basics.summary}}<p class="summary">{{basics.summary}}</p>{{/if}}
  </header>

  {{#if workExperience.length}}
  <section class="section">
    <h2>Work Experience</h2>
    {{#each workExperience}}
    <div class="entry">
      <div class="entry-head">
        <strong>{{position}}</strong> — {{company}}
        <span class="dates">{{dateRange startDate endDate}}</span>
      </div>
      {{#if highlights.length}}
      <ul>
        {{#each highlights}}<li>{{this}}</li>{{/each}}
      </ul>
      {{/if}}
      {{#if technologies.length}}
      <p class="tech">{{join technologies ", "}}</p>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if education.length}}
  <section class="section">
    <h2>Education</h2>
    {{#each education}}
    <div class="entry">
      <strong>{{degree}}{{#if fieldOfStudy}}, {{fieldOfStudy}}{{/if}}</strong> — {{institution}}
      <span class="dates">{{dateRange startDate endDate}}</span>
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if skills.length}}
  <section class="section">
    <h2>Skills</h2>
    {{#each skills}}
    <div class="entry">
      <strong>{{category}}:</strong> {{join keywords ", "}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if projects.length}}
  <section class="section">
    <h2>Projects</h2>
    {{#each projects}}
    <div class="entry">
      <strong>{{title}}</strong>{{#if url}} — <a href="{{url}}">{{url}}</a>{{/if}}
      <p>{{description}}</p>
      {{#if highlights.length}}
      <ul>
        {{#each highlights}}<li>{{this}}</li>{{/each}}
      </ul>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}
</div>
`.trim();

export const DEFAULT_TEMPLATE_CSS = `
body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #212529; margin: 0; padding: 2rem; }
.resume { max-width: 800px; margin: 0 auto; }
.resume-header h1 { margin: 0 0 0.25rem; font-size: 2rem; }
.headline { color: #495057; margin: 0 0 0.5rem; font-size: 1.1rem; }
.contact { color: #6c757d; font-size: 0.9rem; margin: 0 0 0.75rem; }
.summary { margin: 0 0 1.5rem; line-height: 1.5; }
.section { margin-bottom: 1.5rem; }
.section h2 { font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #212529; padding-bottom: 0.25rem; margin-bottom: 0.75rem; }
.entry { margin-bottom: 1rem; }
.entry-head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
.dates { color: #6c757d; font-size: 0.85rem; }
.tech { color: #6c757d; font-size: 0.85rem; margin: 0.25rem 0 0; }
ul { margin: 0.35rem 0 0; padding-left: 1.25rem; }
li { margin-bottom: 0.25rem; line-height: 1.4; }
`.trim();
