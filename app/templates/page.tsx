"use client";

import { useEffect, useState } from "react";

type Template = {
  id: string;
  name: string;
  description: string | null;
  htmlContent: string;
  cssContent: string;
  createdAt: string;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [designPrompt, setDesignPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Template | null>(null);

  async function load() {
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setTemplates(data);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!designPrompt.trim()) return;
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userDesignPrompt: designPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setDesignPrompt("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    await load();
  }

  return (
    <div>
      <h1 className="h3 mb-4">Templates</h1>

      <div className="card mb-4">
        <div className="card-header">Generate Template with AI (Agent 1)</div>
        <div className="card-body">
          <form onSubmit={handleGenerate}>
            <textarea
              className="form-control mb-2"
              rows={3}
              placeholder='e.g. "Minimalist single-column layout with a bold header, dark accent color, and clean typography"'
              value={designPrompt}
              onChange={(e) => setDesignPrompt(e.target.value)}
            />
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <button className="btn btn-primary" disabled={generating}>
              {generating ? "Generating…" : "Generate Template"}
            </button>
          </form>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          {loading ? (
            <p className="text-secondary">Loading…</p>
          ) : templates.length === 0 ? (
            <p className="text-secondary">No templates yet.</p>
          ) : (
            <div className="list-group">
              {templates.map((t) => (
                <button
                  key={t.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    selected?.id === t.id ? "active" : ""
                  }`}
                  onClick={() => setSelected(t)}
                >
                  <span>
                    <div className="fw-semibold">{t.name}</div>
                    {t.description && (
                      <div className="small text-secondary">{t.description}</div>
                    )}
                  </span>
                  <span
                    className="btn btn-sm btn-outline-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                  >
                    Delete
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-7">
          {selected ? (
            <div className="card">
              <div className="card-header">Preview: {selected.name}</div>
              <div className="card-body p-0">
                <iframe
                  title="Template preview"
                  srcDoc={`<style>${selected.cssContent}</style>${selected.htmlContent}`}
                  style={{ width: "100%", height: "500px", border: "none" }}
                />
              </div>
            </div>
          ) : (
            <p className="text-secondary">Select a template to preview it.</p>
          )}
        </div>
      </div>
    </div>
  );
}
