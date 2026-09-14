"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type ResumeRecord = {
  id: string;
  title: string;
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
  const resumeId = params.id;

  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [updateInput, setUpdateInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadResume = useCallback(async () => {
    const res = await fetch(`/api/resumes/${resumeId}`);
    if (res.ok) setResume(await res.json());
  }, [resumeId]);

  const loadVersions = useCallback(async () => {
    const res = await fetch(`/api/resumes/${resumeId}/versions`);
    if (res.ok) setVersions(await res.json());
  }, [resumeId]);

  const loadPreview = useCallback(async () => {
    const url = selectedTemplateId
      ? `/api/resumes/${resumeId}/render?templateId=${selectedTemplateId}`
      : `/api/resumes/${resumeId}/render`;
    const res = await fetch(url);
    if (res.ok) setPreviewHtml(await res.text());
  }, [resumeId, selectedTemplateId]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch(`/api/resumes/${resumeId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/resumes/${resumeId}/versions`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/templates`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([resumeData, versionsData, templatesData]) => {
      if (ignore) return;
      if (resumeData) setResume(resumeData);
      setVersions(versionsData);
      setTemplates(templatesData);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [resumeId]);

  useEffect(() => {
    let ignore = false;
    const url = selectedTemplateId
      ? `/api/resumes/${resumeId}/render?templateId=${selectedTemplateId}`
      : `/api/resumes/${resumeId}/render`;
    fetch(url)
      .then((res) => (res.ok ? res.text() : ""))
      .then((html) => {
        if (!ignore) setPreviewHtml(html);
      });
    return () => {
      ignore = true;
    };
  }, [resumeId, selectedTemplateId]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updateInput.trim()) return;
    setError("");
    setUpdating(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUpdateInput: updateInput }),
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
    const url = selectedTemplateId
      ? `/api/resumes/${resumeId}/export?templateId=${selectedTemplateId}`
      : `/api/resumes/${resumeId}/export`;
    window.open(url, "_blank");
  }

  if (loading) return <p className="text-secondary">Loading…</p>;
  if (!resume) return <p className="text-danger">Resume not found.</p>;

  const json = JSON.parse(resume.currentJson);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h3 mb-1">{resume.title}</h1>
          <small className="text-secondary">
            Last updated {new Date(resume.updatedAt).toLocaleString()}
          </small>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            <option value="">Default Template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="btn btn-outline-primary text-nowrap" onClick={handleExport}>
            Export PDF
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card mb-4">
            <div className="card-header">Live Preview</div>
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
          <div className="card mb-4">
            <div className="card-header">Update Resume (AI Agent)</div>
            <div className="card-body">
              <form onSubmit={handleUpdate}>
                <textarea
                  className="form-control mb-2"
                  rows={4}
                  placeholder='e.g. "I just finished a 4-month role as a Full Stack Software Engineer at Acme working on microservices using Laravel and React"'
                  value={updateInput}
                  onChange={(e) => setUpdateInput(e.target.value)}
                />
                {error && (
                  <div className="alert alert-danger py-2">{error}</div>
                )}
                <button className="btn btn-primary" disabled={updating}>
                  {updating ? "Updating…" : "Submit Update"}
                </button>
              </form>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">Version History</div>
            <ul className="list-group list-group-flush">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="list-group-item d-flex justify-content-between align-items-start"
                >
                  <div>
                    <div className="fw-semibold">v{v.versionNumber}</div>
                    <div className="small text-secondary">{v.changeSummary}</div>
                    <div className="small text-secondary">
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleRollback(v.id)}
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="card-header">Source of Truth JSON</div>
            <div className="card-body">
              <pre className="small mb-0" style={{ maxHeight: 300, overflow: "auto" }}>
                {JSON.stringify(json, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
