"use client";

import { useEffect, useState, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  STANDARD_RESUME_JSON_SCHEMA,
  TECH_CERTIFICATIONS_JSON_SCHEMA,
} from "@/lib/templates/schemas";

type Template = {
  id: string;
  name: string;
  description: string | null;
  htmlContent: string;
  cssContent: string;
  schemaJson: string;
  createdAt: string;
};

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);

  // Form states for creating / uploading template
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [cssContent, setCssContent] = useState("");
  const [schemaJsonText, setSchemaJsonText] = useState(
    JSON.stringify(STANDARD_RESUME_JSON_SCHEMA, null, 2)
  );
  const [schemaError, setSchemaError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Schema viewer modal
  const [viewingSchema, setViewingSchema] = useState<string | null>(null);

  const htmlInputId = useId();
  const cssInputId = useId();
  const schemaInputId = useId();

  async function loadTemplates() {
    try {
      const res = await fetch("/api/templates");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selected) {
        setSelected(data[0]);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    fetch("/api/templates")
      .then((res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!ignore && data) {
          const list = Array.isArray(data) ? data : [];
          setTemplates(list);
          if (list.length > 0) {
            setSelected(list[0]);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading templates:", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [router]);

  // Handle Logout
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  // Load sample schema helpers
  function loadStandardSample() {
    setSchemaJsonText(JSON.stringify(STANDARD_RESUME_JSON_SCHEMA, null, 2));
    setSchemaError("");
  }

  function loadTechSample() {
    setSchemaJsonText(JSON.stringify(TECH_CERTIFICATIONS_JSON_SCHEMA, null, 2));
    setSchemaError("");
  }

  // Validate JSON schema whenever text changes
  function handleSchemaChange(value: string) {
    setSchemaJsonText(value);
    try {
      JSON.parse(value);
      setSchemaError("");
    } catch (err) {
      setSchemaError((err as Error).message);
    }
  }

  // Format Schema JSON
  function formatSchemaJson() {
    try {
      const parsed = JSON.parse(schemaJsonText);
      setSchemaJsonText(JSON.stringify(parsed, null, 2));
      setSchemaError("");
    } catch (err) {
      setSchemaError("Cannot format invalid JSON: " + (err as Error).message);
    }
  }

  // Handle File Uploads
  function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (content: string) => void,
    isJson = false
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      if (isJson) {
        handleSchemaChange(content);
      } else {
        setter(content);
      }
    };
    reader.readAsText(file);
  }

  // Handle Template Creation
  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!name.trim()) {
      setSubmitError("Template name is required.");
      return;
    }
    if (!htmlContent.trim()) {
      setSubmitError("HTML content is required.");
      return;
    }

    try {
      JSON.parse(schemaJsonText);
    } catch {
      setSubmitError("Please fix the JSON schema syntax error before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          htmlContent,
          cssContent,
          schemaJson: schemaJsonText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create template");
      }

      setSubmitSuccess(`Template "${name}" uploaded successfully!`);
      setName("");
      setDescription("");
      setHtmlContent("");
      setCssContent("");
      setSchemaJsonText(JSON.stringify(STANDARD_RESUME_JSON_SCHEMA, null, 2));

      await loadTemplates();
      setSelected(data);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Delete Template
  async function handleDeleteTemplate(id: string, tName: string) {
    if (!confirm(`Are you sure you want to delete template "${tName}"?`)) return;

    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (selected?.id === id) setSelected(null);
      await loadTemplates();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <span className="badge bg-danger mb-1">Admin Dashboard</span>
          <h1 className="h3 fw-bold mb-0">Template & Schema Management</h1>
          <p className="text-secondary small mb-0">
            Upload new templates, define required JSON schemas, and inspect active templates.
          </p>
        </div>
        <div>
          <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <Link className="nav-link active fw-semibold" href="/admin/templates">
            Templates & Schemas
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" href="/admin/settings">
            API Keys & Models
          </Link>
        </li>
      </ul>

      <div className="row g-4">
        {/* Left Column: Upload / Create Template */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-dark text-white fw-semibold d-flex justify-content-between align-items-center">
              <span>Upload / Add Template with Schema</span>
            </div>
            <div className="card-body">
              {submitSuccess && (
                <div className="alert alert-success py-2 small">{submitSuccess}</div>
              )}
              {submitError && (
                <div className="alert alert-danger py-2 small">{submitError}</div>
              )}

              <form onSubmit={handleCreateTemplate}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Template Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Modern Minimalist, Tech & Cloud Engineer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Description</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Brief description of the template styling and audience"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* HTML Field */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">
                      Handlebars HTML Template *
                    </label>
                    <label
                      htmlFor={htmlInputId}
                      className="btn btn-xs btn-outline-secondary py-0 px-2 small"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Upload .html
                    </label>
                    <input
                      id={htmlInputId}
                      type="file"
                      accept=".html,.hbs,.txt"
                      className="d-none"
                      onChange={(e) => handleFileUpload(e, setHtmlContent)}
                    />
                  </div>
                  <textarea
                    className="form-control form-control-sm font-monospace"
                    rows={6}
                    placeholder="<div>{{basics.fullName}}</div>..."
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    required
                  />
                </div>

                {/* CSS Field */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">CSS Styles</label>
                    <label
                      htmlFor={cssInputId}
                      className="btn btn-xs btn-outline-secondary py-0 px-2 small"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Upload .css
                    </label>
                    <input
                      id={cssInputId}
                      type="file"
                      accept=".css,.txt"
                      className="d-none"
                      onChange={(e) => handleFileUpload(e, setCssContent)}
                    />
                  </div>
                  <textarea
                    className="form-control form-control-sm font-monospace"
                    rows={4}
                    placeholder="body { font-family: sans-serif; }..."
                    value={cssContent}
                    onChange={(e) => setCssContent(e.target.value)}
                  />
                </div>

                {/* JSON Schema Field */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">
                      Template JSON Schema (Draft-07) *
                    </label>
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        onClick={loadStandardSample}
                        className="btn btn-outline-primary btn-xs py-0 px-1"
                        style={{ fontSize: "0.72rem" }}
                      >
                        Standard Schema
                      </button>
                      <button
                        type="button"
                        onClick={loadTechSample}
                        className="btn btn-outline-info btn-xs py-0 px-1"
                        style={{ fontSize: "0.72rem" }}
                      >
                        Tech Schema
                      </button>
                      <button
                        type="button"
                        onClick={formatSchemaJson}
                        className="btn btn-outline-secondary btn-xs py-0 px-1"
                        style={{ fontSize: "0.72rem" }}
                      >
                        Format
                      </button>
                      <label
                        htmlFor={schemaInputId}
                        className="btn btn-outline-secondary btn-xs py-0 px-1 mb-0"
                        style={{ fontSize: "0.72rem" }}
                      >
                        Upload .json
                      </label>
                      <input
                        id={schemaInputId}
                        type="file"
                        accept=".json"
                        className="d-none"
                        onChange={(e) => handleFileUpload(e, () => {}, true)}
                      />
                    </div>
                  </div>
                  <textarea
                    className={`form-control form-control-sm font-monospace ${
                      schemaError ? "is-invalid" : ""
                    }`}
                    rows={8}
                    value={schemaJsonText}
                    onChange={(e) => handleSchemaChange(e.target.value)}
                    required
                  />
                  {schemaError && (
                    <div className="invalid-feedback small font-monospace">
                      JSON Syntax Error: {schemaError}
                    </div>
                  )}
                  <div className="form-text small">
                    The AI will strictly adhere to this schema when generating or updating content for resumes using this template.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold"
                  disabled={submitting || !!schemaError}
                >
                  {submitting ? "Uploading Template…" : "Upload & Save Template"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Templates List & Live Preview */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-light fw-semibold">
              Existing Templates ({templates.length})
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-3 text-secondary">Loading templates…</div>
              ) : templates.length === 0 ? (
                <div className="p-3 text-secondary">No templates uploaded yet.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        selected?.id === t.id ? "active text-white" : ""
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(t)}
                    >
                      <div>
                        <div className="fw-semibold">{t.name}</div>
                        {t.description && (
                          <div
                            className={`small ${
                              selected?.id === t.id ? "text-white-50" : "text-secondary"
                            }`}
                          >
                            {t.description}
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className={`btn btn-xs ${
                            selected?.id === t.id
                              ? "btn-light text-dark"
                              : "btn-outline-secondary"
                          } py-1 px-2 small`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingSchema(t.schemaJson);
                          }}
                        >
                          View Schema
                        </button>
                        <button
                          className="btn btn-xs btn-outline-danger py-1 px-2 small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(t.id, t.name);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          {selected && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <span className="fw-semibold">Preview: {selected.name}</span>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setViewingSchema(selected.schemaJson)}
                >
                  Inspect Template Schema
                </button>
              </div>
              <div className="card-body p-0">
                <iframe
                  title="Template preview"
                  srcDoc={`<style>${selected.cssContent}</style>${selected.htmlContent}`}
                  style={{ width: "100%", height: "420px", border: "none" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schema Viewer Modal */}
      {viewingSchema && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Template JSON Schema Definition</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingSchema(null)}
                />
              </div>
              <div className="modal-body">
                <p className="text-secondary small">
                  The AI Agent uses this exact schema definition to validate and structure the JSON data when updating resumes with this template.
                </p>
                <pre
                  className="bg-light p-3 rounded border font-monospace small"
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                >
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(viewingSchema), null, 2);
                    } catch {
                      return viewingSchema;
                    }
                  })()}
                </pre>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingSchema(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
