"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Resume = {
  id: string;
  title: string;
  templateId?: string | null;
  resumeGroupId?: string | null;
  language: string;
  updatedAt: string;
};

type Template = {
  id: string;
  name: string;
  description: string | null;
};

function ResumesDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTemplateId = searchParams.get("templateId") || "";

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!queryTemplateId);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(queryTemplateId);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch("/api/resumes").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ])
      .then(([resumesData, templatesData]) => {
        if (!ignore) {
          setResumes(Array.isArray(resumesData) ? resumesData : []);
          const tpls = Array.isArray(templatesData) ? templatesData : [];
          setTemplates(tpls);
          if (queryTemplateId) {
            setSelectedTemplateId(queryTemplateId);
            setShowForm(true);
          } else if (tpls.length > 0) {
            setSelectedTemplateId((prev) => prev || tpls[0].id);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load dashboard data:", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [queryTemplateId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedTemplateId) {
      setError("Please select a template for your resume.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          title,
          templateId: selectedTemplateId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create resume");
      }
      const created = await res.json();
      router.push(`/resumes/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  // Helper to get template name
  function getTemplateName(templateId?: string | null) {
    if (!templateId) return "Default Template";
    const found = templates.find((t) => t.id === templateId);
    return found ? found.name : "Custom Template";
  }

  // Only show the original resume per group — language versions cloned
  // from it (resumeGroupId !== id) are hidden from this list.
  const parentResumes = resumes.filter(
    (r) => !r.resumeGroupId || r.resumeGroupId === r.id
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Resumes</h1>
          <p className="text-secondary small mb-0">
            Each resume is permanently tailored to its chosen design template.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? "Cancel" : "+ New Resume"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 shadow-sm border-0">
          <div className="card-header bg-dark text-white fw-semibold">
            Create a New Resume
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate} className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Full Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Resume Title (optional)
                </label>
                <input
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cloud Architect Resume 2026"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Choose Template *
                </label>
                <select
                  className="form-select"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    -- Select a template --
                  </option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="form-text small">
                  The resume will follow this template&apos;s schema structure permanently.
                </div>
              </div>

              {error && (
                <div className="col-12">
                  <div className="alert alert-danger py-2 small">{error}</div>
                </div>
              )}

              <div className="col-12">
                <button className="btn btn-success px-4" disabled={creating}>
                  {creating ? "Creating Resume…" : "Create Resume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-secondary">Loading resumes…</p>
      ) : parentResumes.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-secondary">
          No resumes yet. Click <strong>+ New Resume</strong> or choose a template from the Templates gallery.
        </div>
      ) : (
        <div className="list-group shadow-sm">
          {parentResumes.map((r) => (
            <Link
              key={r.id}
              href={`/resumes/${r.id}`}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
            >
              <div>
                <div className="fw-semibold fs-6">{r.title}</div>
                <div className="small text-muted mt-1">
                  <span className="badge bg-light text-dark border me-2">
                    {getTemplateName(r.templateId)}
                  </span>
                  Updated {new Date(r.updatedAt).toLocaleString()}
                </div>
              </div>
              <span className="btn btn-sm btn-outline-primary">Open Editor &rarr;</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResumesPage() {
  return (
    <Suspense fallback={<div className="text-secondary">Loading dashboard…</div>}>
      <ResumesDashboard />
    </Suspense>
  );
}
