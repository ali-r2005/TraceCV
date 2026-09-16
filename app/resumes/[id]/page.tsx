"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type ResumeRecord = {
  id: string;
  title: string;
  templateId?: string | null;
  currentJson: string;
  resumeGroupId?: string | null;
  language: string;
  syncSourceId?: string | null;
  updatedAt: string;
};

type Version = {
  id: string;
  versionNumber: number;
  changeSummary: string;
  snapshotJson: string;
  createdAt: string;
};

type TemplateSummary = {
  id: string;
  name: string;
};

type ModelOption = {
  id: string;
  name: string;
  provider: "gemini" | "openai";
  description: string;
  isAvailable: boolean;
  isDefault?: boolean;
};

export default function ResumeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const resumeId = params.id;

  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("gemini-2.5-flash");

  const [previewHtml, setPreviewHtml] = useState("");
  const [updateInput, setUpdateInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [committing, setCommitting] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [viewingVersion, setViewingVersion] = useState<Version | null>(null);
  const [viewingHtml, setViewingHtml] = useState("");
  const [viewingLoading, setViewingLoading] = useState(false);

  const [languages, setLanguages] = useState<ResumeRecord[]>([]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [addingLanguage, setAddingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

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
      fetch(`/api/ai/models`).then((r) => (r.ok ? r.json() : { models: [] })),
      fetch(`/api/resumes/${resumeId}/render`).then((r) => (r.ok ? r.text() : "")),
      fetch(`/api/resumes/${resumeId}/languages`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([resumeData, versionsData, templatesData, modelsData, previewData, languagesData]) => {
      if (ignore) return;
      if (resumeData) setResume(resumeData);
      setVersions(versionsData);
      setTemplates(templatesData);
      setLanguages(languagesData);
      const fetchedModels: ModelOption[] = modelsData.models || [];
      setModels(fetchedModels);

      // Default to first available model or default model
      const firstAvailable = fetchedModels.find((m) => m.isAvailable);
      if (firstAvailable) {
        setSelectedModelId(firstAvailable.id);
      } else if (fetchedModels.length > 0) {
        setSelectedModelId(fetchedModels[0].id);
      }

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
          modelId: selectedModelId,
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

  const latestVersion = versions[0];
  const hasUncommittedChanges =
    !latestVersion || (resume && latestVersion.snapshotJson !== resume.currentJson);

  async function handleRollback(version: Version) {
    const isTipWithUncommitted =
      version === versions[0] && hasUncommittedChanges;
    const message = isTipWithUncommitted
      ? `Discard uncommitted changes and restore v${version.versionNumber}? This cannot be undone.`
      : `Roll back to v${version.versionNumber}? This will permanently delete every version committed after it. This cannot be undone.`;
    if (!confirm(message)) return;
    setRollingBackId(version.id);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/versions/${version.id}`, {
        method: "POST",
      });
      if (res.ok) {
        await Promise.all([loadResume(), loadVersions()]);
        await loadPreview();
      }
    } finally {
      setRollingBackId(null);
    }
  }

  function openCommitModal() {
    setCommitMessage("");
    setError("");
    setShowCommitModal(true);
  }

  async function openVersionPreview(version: Version) {
    setViewingVersion(version);
    setViewingHtml("");
    setViewingLoading(true);
    try {
      const templateParam = resume?.templateId
        ? `&templateId=${resume.templateId}`
        : "";
      const res = await fetch(
        `/api/resumes/${resumeId}/render?versionId=${version.id}${templateParam}`
      );
      if (res.ok) setViewingHtml(await res.text());
    } finally {
      setViewingLoading(false);
    }
  }

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    setError("");
    setCommitting(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeSummary: commitMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Commit failed");
      setShowCommitModal(false);
      setCommitMessage("");
      await loadVersions();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCommitting(false);
    }
  }

  function handleExport() {
    window.open(`/api/resumes/${resumeId}/export`, "_blank");
  }

  function openLanguageModal() {
    setNewLanguage("");
    setLanguageError("");
    setShowLanguageModal(true);
  }

  async function handleAddLanguage(e: React.FormEvent) {
    e.preventDefault();
    if (!newLanguage.trim()) return;
    setLanguageError("");
    setAddingLanguage(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/languages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLanguage.trim(), modelId: selectedModelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add language version");
      setShowLanguageModal(false);
      setNewLanguage("");
      router.push(`/resumes/${data.id}`);
    } catch (err) {
      setLanguageError((err as Error).message);
    } finally {
      setAddingLanguage(false);
    }
  }

  async function handleSync() {
    setError("");
    setSyncMessage("");
    setSyncing(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: selectedModelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      if (data.changed) {
        setSyncMessage(`Synced ${data.appliedOps} change(s) — review below and commit when ready.`);
        await loadResume();
        await loadPreview();
      } else {
        setSyncMessage(data.message || "Already up to date.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSyncing(false);
    }
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

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const isSelectedModelAvailable = selectedModel?.isAvailable ?? false;

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
          <button
            className="btn btn-success text-nowrap"
            onClick={openCommitModal}
            disabled={!hasUncommittedChanges}
            title={
              hasUncommittedChanges
                ? "Commit the current changes as a new version"
                : "No changes to commit"
            }
          >
            {hasUncommittedChanges ? "Stage & Commit" : "No Changes to Commit"}
          </button>
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

      {hasUncommittedChanges && (
        <div className="alert alert-warning py-2 small mb-3">
          You have uncommitted changes. Click <strong>Stage &amp; Commit</strong> to save them to version history.
        </div>
      )}

      <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
        <span className="small text-secondary fw-semibold">Language versions:</span>
        {languages.map((l) => (
          <Link
            key={l.id}
            href={`/resumes/${l.id}`}
            className={`btn btn-sm text-nowrap ${
              l.id === resume.id ? "btn-dark" : "btn-outline-secondary"
            }`}
          >
            {l.language}
          </Link>
        ))}
        <button
          className="btn btn-sm btn-outline-primary text-nowrap"
          onClick={openLanguageModal}
        >
          + Add Language
        </button>
        {resume.syncSourceId && (() => {
          const sourceLang = languages.find((l) => l.id === resume.syncSourceId);
          return (
            <button
              className="btn btn-sm btn-outline-success text-nowrap"
              onClick={handleSync}
              disabled={syncing}
              title={`Pull changes made on the ${sourceLang?.language || "source"} version and translate them here`}
            >
              {syncing ? "Syncing…" : `⟳ Sync from ${sourceLang?.language || "source"}`}
            </button>
          );
        })()}
      </div>

      {syncMessage && (
        <div className="alert alert-info py-2 small mb-3">{syncMessage}</div>
      )}

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
                style={{ width: "100%", height: "calc(100vh - 220px)", border: "none" }}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
              <span>Update Resume (AI Agent)</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdate}>
                {/* AI Model Switcher */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">Select AI Model</label>
                    {selectedModel && (
                      <span
                        className={`badge ${
                          selectedModel.provider === "gemini" ? "bg-info text-dark" : "bg-dark"
                        }`}
                        style={{ fontSize: "0.72rem" }}
                      >
                        {selectedModel.provider === "gemini" ? "Google Gemini" : "OpenAI"}
                      </span>
                    )}
                  </div>
                  <select
                    className="form-select form-select-sm"
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    disabled={updating}
                  >
                    <optgroup label="Google Gemini">
                      {models
                        .filter((m) => m.provider === "gemini")
                        .map((m) => (
                          <option key={m.id} value={m.id} disabled={!m.isAvailable}>
                            {m.name} {!m.isAvailable ? "— (Key not set in Admin DB)" : ""}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="OpenAI">
                      {models
                        .filter((m) => m.provider === "openai")
                        .map((m) => (
                          <option key={m.id} value={m.id} disabled={!m.isAvailable}>
                            {m.name} {!m.isAvailable ? "— (Key not set in Admin DB)" : ""}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  {selectedModel && (
                    <div className="text-muted small mt-1" style={{ fontSize: "0.78rem" }}>
                      {selectedModel.description}
                    </div>
                  )}
                  {!isSelectedModelAvailable && (
                    <div className="alert alert-warning py-1 px-2 small mt-2 mb-0" style={{ fontSize: "0.75rem" }}>
                      The API key for this model is not configured yet in the database. Please configure it in the <Link href="/admin/settings">Admin Portal</Link>.
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-semibold">Prompt Instructions</label>
                  <textarea
                    className="form-control mb-2"
                    rows={4}
                    placeholder='e.g. "I just completed a 4-month role as a Full Stack Engineer at Acme working on microservices with React and Node.js"'
                    value={updateInput}
                    onChange={(e) => setUpdateInput(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="alert alert-danger py-2 small">{error}</div>
                )}
                <button
                  className="btn btn-primary w-100"
                  disabled={updating || !isSelectedModelAvailable}
                >
                  {updating ? "Updating with AI…" : "Submit Update with AI"}
                </button>
              </form>
            </div>
          </div>

          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header bg-light fw-semibold">Commit History</div>
            <ul className="list-group list-group-flush" style={{ maxHeight: "250px", overflowY: "auto" }}>
              {versions.length === 0 && (
                <li className="list-group-item small text-secondary">No commits yet.</li>
              )}
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
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-xs btn-outline-primary py-0 px-2 text-nowrap"
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => openVersionPreview(v)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-xs btn-outline-secondary py-0 px-2 text-nowrap"
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => handleRollback(v)}
                      disabled={
                        rollingBackId === v.id ||
                        (v === versions[0] && !hasUncommittedChanges)
                      }
                      title={
                        v === versions[0] && !hasUncommittedChanges
                          ? "This is already the current state"
                          : v === versions[0]
                          ? "Discard uncommitted changes and restore this version"
                          : "Roll back and delete all versions after this one"
                      }
                    >
                      {rollingBackId === v.id ? "Rolling back…" : "Rollback"}
                    </button>
                  </div>
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

      {showCommitModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          onClick={() => !committing && setShowCommitModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <form onSubmit={handleCommit}>
                <div className="modal-header">
                  <h5 className="modal-title">Commit Changes</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCommitModal(false)}
                    disabled={committing}
                  />
                </div>
                <div className="modal-body">
                  <label className="form-label small fw-semibold">Commit message</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Added Acme Full Stack Engineer role"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    autoFocus
                  />
                  {error && (
                    <div className="alert alert-danger py-2 small mt-2 mb-0">{error}</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCommitModal(false)}
                    disabled={committing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={committing || !commitMessage.trim()}
                  >
                    {committing ? "Committing…" : "Commit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showLanguageModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          onClick={() => !addingLanguage && setShowLanguageModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <form onSubmit={handleAddLanguage}>
                <div className="modal-header">
                  <h5 className="modal-title">Add Language Version</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowLanguageModal(false)}
                    disabled={addingLanguage}
                  />
                </div>
                <div className="modal-body">
                  <label className="form-label small fw-semibold">Language</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. French, Spanish, German…"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    autoFocus
                  />
                  <div className="form-text">
                    Creates a new copy of this resume, translated to the language you
                    enter by AI. You&apos;ll review it before committing.
                  </div>
                  {languageError && (
                    <div className="alert alert-danger py-2 small mt-2 mb-0">
                      {languageError}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowLanguageModal(false)}
                    disabled={addingLanguage}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={addingLanguage || !newLanguage.trim()}
                  >
                    {addingLanguage ? "Translating…" : "Create & Translate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewingVersion && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          onClick={() => setViewingVersion(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  v{viewingVersion.versionNumber} &middot;{" "}
                  <span className="text-secondary fw-normal">
                    {viewingVersion.changeSummary}
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingVersion(null)}
                />
              </div>
              <div className="modal-body p-0">
                <div className="small text-muted px-3 pt-2">
                  Committed {new Date(viewingVersion.createdAt).toLocaleString()}
                </div>
                {viewingLoading ? (
                  <p className="text-secondary p-3 mb-0">Loading preview…</p>
                ) : (
                  <iframe
                    title="Commit preview"
                    srcDoc={viewingHtml}
                    style={{ width: "100%", height: "550px", border: "none" }}
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setViewingVersion(null)}
                >
                  Close
                </button>
                {(viewingVersion !== versions[0] || hasUncommittedChanges) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={rollingBackId === viewingVersion.id}
                    onClick={async () => {
                      const target = viewingVersion;
                      setViewingVersion(null);
                      await handleRollback(target);
                    }}
                  >
                    Rollback to this Version
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
