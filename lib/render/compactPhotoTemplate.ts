/**
 * "Compact Photo CV" template — adapted from Ali Rami's personal A4 resume
 * design (photo header, three-column skills, work experience, projects,
 * education, certifications grid). Bound to COMPACT_PHOTO_CV_JSON_SCHEMA.
 */
export const COMPACT_PHOTO_CV_HTML = `
<main class="page">
  <section class="header">
    {{#if basics.photoUrl}}
    <div class="photo"><img src="{{basics.photoUrl}}" alt="Photo de profil" /></div>
    {{/if}}

    <div class="head-main">
      <h1 class="name">{{basics.fullName}}</h1>
      <div class="role">{{basics.role}}</div>

      <div class="contacts">
        {{#if basics.location}}<span>{{basics.location}}</span><span class="dot">|</span>{{/if}}
        {{#if basics.phone}}<span>{{basics.phone}}</span><span class="dot">|</span>{{/if}}
        {{#if basics.email}}<a href="mailto:{{basics.email}}" class="custom-link">{{basics.email}}</a>{{/if}}
        {{#if basics.githubUrl}}<span class="dot">|</span><a href="{{basics.githubUrl}}" class="custom-link" target="_blank">github</a>{{/if}}
        {{#if basics.linkedinUrl}}<span class="dot">|</span><a href="{{basics.linkedinUrl}}" class="custom-link" target="_blank">linkedin</a>{{/if}}
      </div>

      {{#if basics.summary}}<p class="desc">{{basics.summary}}</p>{{/if}}
    </div>
  </section>

  <div class="sep"></div>

  {{#if skills.length}}
  <h2>{{labels.skills}}</h2>
  <section class="skills-grid">
    {{#each skills}}
    <div class="skill-block">
      {{#each groups}}
      <div class="label">{{label}}</div>
      <div class="text">{{text}}</div>
      {{/each}}
    </div>
    {{/each}}
  </section>
  <div class="sep"></div>
  {{/if}}

  {{#if workExperience.length}}
  <h2>{{labels.workExperience}}</h2>
  {{#each workExperience}}
  <div class="exp-item">
    <div>
      <p class="exp-title">{{position}}</p>
      <p class="exp-org">{{company}}</p>
      {{#if highlights.length}}
      <ul class="exp-bullets">
        {{#each highlights}}<li>{{this}}</li>{{/each}}
      </ul>
      {{/if}}
    </div>
    <div class="exp-date">{{lookup this "dateRange"}}</div>
  </div>
  {{/each}}
  <div class="sep"></div>
  {{/if}}

  <div class="bottom">
    <section>
      {{#if projects.length}}
      <h2>{{labels.projects}}</h2>
      <ul class="small">
        {{#each projects}}
        <li><strong>{{title}}</strong>{{#if stack}} ({{stack}}){{/if}}: {{description}}</li>
        {{/each}}
      </ul>
      {{/if}}

      {{#if education.length}}
      <h2>{{labels.education}}</h2>
      <ul class="small">
        {{#each education}}
        <li><strong>{{degree}}</strong> {{institution}}{{#if dateRange}} <span class="muted">{{lookup this "dateRange"}}</span>{{/if}}</li>
        {{/each}}
      </ul>
      {{/if}}
    </section>

    {{#if certifications.length}}
    <section>
      <h2>{{labels.certifications}}</h2>
      <div class="cert-grid">
        {{#each certifications}}
        <div>{{issuer}} — {{name}} <span class="muted">{{date}}</span></div>
        {{/each}}
      </div>
    </section>
    {{/if}}
  </div>
</main>
`.trim();

export const COMPACT_PHOTO_CV_CSS = `
* { box-sizing: border-box; }
body { margin: 0; background: #f2f2f2; font-family: Arial, Helvetica, sans-serif; color: #111; }
.page { width: 210mm; min-height: 297mm; margin: 10px auto; background: #fff; padding: 10mm; box-shadow: 0 6px 20px rgba(0,0,0,.08); }
:root { --blue: #1f63d6; --line: #e6e6e6; --muted: #4f4f4f; }
.muted { color: var(--muted); }
.sep { height: 1px; background: var(--line); margin: 6px 0; }
h2 { margin: 8px 0 5px; font-size: 11px; color: var(--blue); letter-spacing: .2px; text-transform: uppercase; }
ul { margin: 0; padding-left: 16px; }
li { margin: 2px 0; }
.header { display: flex; gap: 12px; align-items: flex-start; }
.photo { width: 90px; height: 100px; border: 2px solid var(--blue); border-radius: 6px; overflow: hidden; flex: 0 0 auto; background: #f7f7f7; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.head-main { flex: 1; }
.name { margin: 0; font-size: 16px; font-weight: 800; color: var(--blue); line-height: 1.05; }
.role { margin: 2px 0 3px; font-size: 12px; color: var(--blue); font-weight: 700; }
.contacts { font-size: 10.5px; color: #111; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.contacts a { color: #111; text-decoration: none; }
.contacts .dot { color: #999; }
.desc { margin: 6px 0 0; font-size: 10.5px; line-height: 1.25; }
.custom-link:hover { color: blue; }
.skills-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 10.5px; line-height: 1.25; }
.skill-block .label { font-weight: 800; margin-bottom: 2px; margin-top: 6px; color: #111; }
.skill-block .label:first-child { margin-top: 0; }
.exp-item { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 6px; }
.exp-title { font-size: 11px; font-weight: 800; margin: 0; }
.exp-org { font-size: 10.5px; font-weight: 700; margin: 0; color: #111; }
.exp-date { font-size: 10.5px; color: var(--muted); white-space: nowrap; padding-top: 2px; }
.exp-bullets { margin-top: 2px; font-size: 10.5px; line-height: 1.25; }
.bottom { display: grid; grid-template-columns: 1.15fr .85fr; gap: 12px; margin-top: 6px; }
.small { font-size: 10.5px; line-height: 1.25; }
.cert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; font-size: 10.5px; line-height: 1.2; }
`.trim();
