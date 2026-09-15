"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SUPPORTED_MODELS } from "@/lib/ai/models";

type KeyStatus = {
  configured: boolean;
  masked: string;
  updatedAt: string | null;
};

type ApiKeysStatus = {
  gemini: KeyStatus;
  openai: KeyStatus;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ApiKeysStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);

  // Action status
  const [savingGemini, setSavingGemini] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiMsg, setGeminiMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [savingOpenai, setSavingOpenai] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [openaiMsg, setOpenaiMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadStatus() {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/settings")
      .then((res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!ignore && data) {
          setStatus(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  // Gemini Actions
  async function handleSaveGemini(e: React.FormEvent) {
    e.preventDefault();
    if (!geminiKey.trim()) return;
    setSavingGemini(true);
    setGeminiMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "gemini", apiKey: geminiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save key");
      setStatus(data.status);
      setGeminiKey("");
      setGeminiMsg({ type: "success", text: "Google Gemini API key saved successfully in database!" });
    } catch (err) {
      setGeminiMsg({ type: "error", text: (err as Error).message });
    } finally {
      setSavingGemini(false);
    }
  }

  async function handleTestGemini() {
    const keyToTest = geminiKey.trim();
    if (!keyToTest && !status?.gemini.configured) {
      setGeminiMsg({ type: "error", text: "Enter an API key to test or save one first." });
      return;
    }
    setTestingGemini(true);
    setGeminiMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gemini",
          apiKey: keyToTest || "USE_SAVED_KEY",
          testOnly: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection test failed");
      setGeminiMsg({ type: "success", text: "Google Gemini connection test passed!" });
    } catch (err) {
      setGeminiMsg({ type: "error", text: (err as Error).message });
    } finally {
      setTestingGemini(false);
    }
  }

  async function handleDeleteGemini() {
    if (!confirm("Remove Google Gemini API key from database?")) return;
    setGeminiMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "gemini", action: "delete" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setStatus(data.status);
      setGeminiMsg({ type: "success", text: "Google Gemini API key removed from database." });
    } catch (err) {
      setGeminiMsg({ type: "error", text: (err as Error).message });
    }
  }

  // OpenAI Actions
  async function handleSaveOpenai(e: React.FormEvent) {
    e.preventDefault();
    if (!openaiKey.trim()) return;
    setSavingOpenai(true);
    setOpenaiMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "openai", apiKey: openaiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save key");
      setStatus(data.status);
      setOpenaiKey("");
      setOpenaiMsg({ type: "success", text: "OpenAI API key saved successfully in database!" });
    } catch (err) {
      setOpenaiMsg({ type: "error", text: (err as Error).message });
    } finally {
      setSavingOpenai(false);
    }
  }

  async function handleTestOpenai() {
    const keyToTest = openaiKey.trim();
    if (!keyToTest && !status?.openai.configured) {
      setOpenaiMsg({ type: "error", text: "Enter an API key to test or save one first." });
      return;
    }
    setTestingOpenai(true);
    setOpenaiMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openai",
          apiKey: keyToTest || "USE_SAVED_KEY",
          testOnly: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection test failed");
      setOpenaiMsg({ type: "success", text: "OpenAI connection test passed!" });
    } catch (err) {
      setOpenaiMsg({ type: "error", text: (err as Error).message });
    } finally {
      setTestingOpenai(false);
    }
  }

  async function handleDeleteOpenai() {
    if (!confirm("Remove OpenAI API key from database?")) return;
    setOpenaiMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "openai", action: "delete" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setStatus(data.status);
      setOpenaiMsg({ type: "success", text: "OpenAI API key removed from database." });
    } catch (err) {
      setOpenaiMsg({ type: "error", text: (err as Error).message });
    }
  }

  return (
    <div>
      {/* Admin Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <span className="badge bg-danger mb-1">Admin Dashboard</span>
          <h1 className="h3 fw-bold mb-0">API Secrets & AI Models</h1>
          <p className="text-secondary small mb-0">
            Manage provider credentials strictly in the database and monitor model availability.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <Link className="nav-link" href="/admin/templates">
            Templates & Schemas
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link active fw-semibold" href="/admin/settings">
            API Keys & Models
          </Link>
        </li>
      </ul>

      <div className="alert alert-info py-2 small mb-4">
        <strong>Database-Only Security:</strong> API keys are saved directly into the SQLite database. The app does not rely on or fall back to <code>.env.local</code> for AI execution.
      </div>

      {loading ? (
        <p className="text-secondary">Loading API settings…</p>
      ) : (
        <div className="row g-4">
          {/* Google Gemini Card */}
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                <span className="fw-semibold">Google Gemini API</span>
                <span
                  className={`badge ${
                    status?.gemini.configured ? "bg-success" : "bg-warning text-dark"
                  }`}
                >
                  {status?.gemini.configured ? "Configured in DB" : "Not Configured"}
                </span>
              </div>
              <div className="card-body">
                {status?.gemini.configured && (
                  <div className="bg-light p-3 rounded mb-3 border">
                    <div className="small text-secondary mb-1">Active Database Key:</div>
                    <code className="fw-bold fs-6 text-dark">{status.gemini.masked}</code>
                    {status.gemini.updatedAt && (
                      <div className="text-muted small mt-1" style={{ fontSize: "0.75rem" }}>
                        Last updated: {new Date(status.gemini.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {geminiMsg && (
                  <div
                    className={`alert alert-${
                      geminiMsg.type === "success" ? "success" : "danger"
                    } py-2 small`}
                  >
                    {geminiMsg.text}
                  </div>
                )}

                <form onSubmit={handleSaveGemini}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      {status?.gemini.configured ? "Update Google Gemini Key" : "Google Gemini API Key"}
                    </label>
                    <div className="input-group">
                      <input
                        type={showGemini ? "text" : "password"}
                        className="form-control font-monospace"
                        placeholder="AIzaSy..."
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setShowGemini(!showGemini)}
                      >
                        {showGemini ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="form-text small">
                      Obtain from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.
                    </div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm px-3"
                      disabled={savingGemini || !geminiKey.trim()}
                    >
                      {savingGemini ? "Saving…" : "Save to DB"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleTestGemini}
                      disabled={testingGemini || (!geminiKey.trim() && !status?.gemini.configured)}
                    >
                      {testingGemini ? "Testing…" : "Test Key"}
                    </button>
                    {status?.gemini.configured && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm ms-auto"
                        onClick={handleDeleteGemini}
                      >
                        Delete Key
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* OpenAI Card */}
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                <span className="fw-semibold">OpenAI API</span>
                <span
                  className={`badge ${
                    status?.openai.configured ? "bg-success" : "bg-warning text-dark"
                  }`}
                >
                  {status?.openai.configured ? "Configured in DB" : "Not Configured"}
                </span>
              </div>
              <div className="card-body">
                {status?.openai.configured && (
                  <div className="bg-light p-3 rounded mb-3 border">
                    <div className="small text-secondary mb-1">Active Database Key:</div>
                    <code className="fw-bold fs-6 text-dark">{status.openai.masked}</code>
                    {status.openai.updatedAt && (
                      <div className="text-muted small mt-1" style={{ fontSize: "0.75rem" }}>
                        Last updated: {new Date(status.openai.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {openaiMsg && (
                  <div
                    className={`alert alert-${
                      openaiMsg.type === "success" ? "success" : "danger"
                    } py-2 small`}
                  >
                    {openaiMsg.text}
                  </div>
                )}

                <form onSubmit={handleSaveOpenai}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      {status?.openai.configured ? "Update OpenAI Key" : "OpenAI API Key"}
                    </label>
                    <div className="input-group">
                      <input
                        type={showOpenai ? "text" : "password"}
                        className="form-control font-monospace"
                        placeholder="sk-proj-..."
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setShowOpenai(!showOpenai)}
                      >
                        {showOpenai ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="form-text small">
                      Obtain from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI Platform</a>.
                    </div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm px-3"
                      disabled={savingOpenai || !openaiKey.trim()}
                    >
                      {savingOpenai ? "Saving…" : "Save to DB"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleTestOpenai}
                      disabled={testingOpenai || (!openaiKey.trim() && !status?.openai.configured)}
                    >
                      {testingOpenai ? "Testing…" : "Test Key"}
                    </button>
                    {status?.openai.configured && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm ms-auto"
                        onClick={handleDeleteOpenai}
                      >
                        Delete Key
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Supported Models Overview */}
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light fw-semibold">
                Supported Models Status (Available for Resume Editing)
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Model Name</th>
                      <th>Provider</th>
                      <th>Model ID</th>
                      <th>Description</th>
                      <th>Status in DB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUPPORTED_MODELS.map((m) => {
                      const isReady = status ? status[m.provider].configured : false;
                      return (
                        <tr key={m.id}>
                          <td className="fw-semibold">
                            {m.name} {m.isDefault && <span className="badge bg-secondary ms-1">Default</span>}
                          </td>
                          <td>
                            <span className={`badge ${m.provider === "gemini" ? "bg-info text-dark" : "bg-dark"}`}>
                              {m.provider === "gemini" ? "Google Gemini" : "OpenAI"}
                            </span>
                          </td>
                          <td><code>{m.id}</code></td>
                          <td className="small text-secondary">{m.description}</td>
                          <td>
                            {isReady ? (
                              <span className="badge bg-success">Ready</span>
                            ) : (
                              <span className="badge bg-secondary">Key Missing</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
