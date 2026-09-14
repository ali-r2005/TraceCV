"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  description: string | null;
  htmlContent: string;
  cssContent: string;
  createdAt: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
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
  }, []);

  function handleCreateFromTemplate(templateId: string) {
    router.push(`/resumes?templateId=${templateId}`);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Resume Templates</h1>
          <p className="text-secondary small mb-0">
            Browse available resume design templates. Select a template and create your resume directly.
          </p>
        </div>
        <Link href="/admin/templates" className="btn btn-sm btn-outline-secondary">
          Admin Portal
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          {loading ? (
            <p className="text-secondary">Loading templates…</p>
          ) : templates.length === 0 ? (
            <div className="card border-0 shadow-sm p-4 text-center text-secondary">
              No templates available.
            </div>
          ) : (
            <div className="list-group shadow-sm">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    selected?.id === t.id ? "active" : ""
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
                  <button
                    className={`btn btn-sm ${
                      selected?.id === t.id ? "btn-light text-dark" : "btn-outline-primary"
                    } text-nowrap ms-2`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFromTemplate(t.id);
                    }}
                  >
                    Use Template &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-7">
          {selected ? (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <div>
                  <span className="fw-semibold">Preview: {selected.name}</span>
                </div>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleCreateFromTemplate(selected.id)}
                >
                  + Create Resume from this Template
                </button>
              </div>
              <div className="card-body p-0">
                <iframe
                  title="Template preview"
                  srcDoc={`<style>${selected.cssContent}</style>${selected.htmlContent}`}
                  style={{ width: "100%", height: "550px", border: "none" }}
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
