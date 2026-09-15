"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type ResumeRecord = {
  id: string;
  title: string;
  templateId?: string | null;
  currentJson: string;
  updatedAt: string;
};

type Version = {
  id: string;
  versionNumber: number;
  changeSummary: string;
  createdAt: string;
};

type TemplateSummary = {
  id: string;
  name: string;
};

export default function ResumeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const resumeId = params.id;

  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [updateInput, setUpdateInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadResume = useCallback(async () => {
    const res = await fetch(`/api/resumes/${resumeId}`);
    if (res.ok) {
      const data = await res.json();
      setResume(data);
    }
  }, [resumeId]);

  const loadVersions = useCallback(async () => {
    const res = await fetch(`/api/resumes/${resumeId}/versions`);
    if (res.ok) setVersions(await res.json());
  }, [resumeId]);

  const loadPreview = useCallback(async () => {
    const res = await fetch(`/api/resumes/${resumeId}/render`);
    if (res.ok) setPreviewHtml(await res.text());
  }, [resumeId]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch(`/api/resumes/${resumeId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/resumes/${resumeId}/versions`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/templates`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/resumes/${resumeId}/render`).then((r) => (r.ok ? r.text() : "")),
    ]).then(([resumeData, versionsData, templatesData, previewData]) => {
      if (ignore) return;
      if (resumeData) setResume(resumeData);
      setVersions(versionsData);
      setTemplates(templatesData);
      setPreviewHtml(previewData);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [resumeId]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updateInput.trim()) return;
    setError("");
    setUpdating(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userUpdateInput: updateInput,
          templateId: resume?.templateId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setUpdateInput("");
      await Promise.all([loadResume(), loadVersions()]);
      await loadPreview();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleRollback(versionId: string) {
    if (!confirm("Roll back the resume to this version?")) return;
    const res = await fetch(`/api/resumes/${resumeId}/versions/${versionId}`, {
      method: "POST",
    });
    if (res.ok) {
      await Promise.all([loadResume(), loadVersions()]);
      await loadPreview();
    }
  }

  function handleExport() {
    window.open(`/api/resumes/${resumeId}/export`, "_blank");
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this resume? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/resumes");
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  }

  function getTemplateName(templateId?: string | null) {
    if (!templateId) return "Default Template";
    const found = templates.find((t) => t.id === templateId);
    return found ? found.name : "Custom Template";
  }

  if (loading) return <p className="text-secondary">Loading…</p>;
  if (!resume) return <p className="text-danger">Resume not found.</p>;

  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(resume.currentJson);
  } catch {
    json = {};
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 mb-0">{resume.title}</h1>
            <span className="badge bg-secondary">
              Template: {getTemplateName(resume.templateId)}
            </span>
          </div>
          <small className="text-secondary">
            Last updated {new Date(resume.updatedAt).toLocaleString()} &middot;{" "}
            <Link href="/resumes" className="text-decoration-none">
              &larr; Back to Resumes
            </Link>
          </small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary text-nowrap" onClick={handleExport}>
            Export PDF
          </button>
          <button
            className="btn btn-danger text-nowrap"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
              <span>Live Preview ({getTemplateName(resume.templateId)})</span>
            </div>
            <div className="card-body p-0">
              <iframe
                title="Resume preview"
                srcDoc={previewHtml}
                style={{ width: "100%", height: "600px", border: "none" }}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header bg-light fw-semibold">Update Resume (AI Agent)</div>
            <div className="card-body">
              <form onSubmit={handleUpdate}>
                <textarea
                  className="form-control mb-2"
                  rows={4}
                  placeholder='e.g. "I just completed a 4-month role as a Full Stack Engineer at Acme working on microservices with React and Node.js"'
                  value={updateInput}
                  onChange={(e) => setUpdateInput(e.target.value)}
                />
                {error && (
                  <div className="alert alert-danger py-2 small">{error}</div>
                )}
                <button className="btn btn-primary w-100" disabled={updating}>
                  {updating ? "Updating with AI…" : "Submit Update with AI"}
                </button>
              </form>
            </div>
          </div>

          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header bg-light fw-semibold">Version History</div>
            <ul className="list-group list-group-flush" style={{ maxHeight: "250px", overflowY: "auto" }}>
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="list-group-item d-flex justify-content-between align-items-start"
                >
                  <div>
                    <div className="fw-semibold small">v{v.versionNumber}</div>
                    <div className="small text-secondary">{v.changeSummary}</div>
                    <div className="small text-muted" style={{ fontSize: "0.75rem" }}>
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className="btn btn-xs btn-outline-secondary py-0 px-2"
                    style={{ fontSize: "0.75rem" }}
                    onClick={() => handleRollback(v.id)}
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-light fw-semibold">Source of Truth JSON</div>
            <div className="card-body">
              <pre className="small mb-0 font-monospace" style={{ maxHeight: 250, overflow: "auto" }}>
                {JSON.stringify(json, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
