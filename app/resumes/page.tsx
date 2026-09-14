"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Resume = {
  id: string;
  title: string;
  updatedAt: string;
};

export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch("/api/resumes")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setResumes(data);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, title }),
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Resumes</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? "Cancel" : "New Resume"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h5 card-title">Create a new resume</h2>
            <form onSubmit={handleCreate} className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Full Name</label>
                <input
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Resume Title (optional)</label>
                <input
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                />
              </div>
              {error && (
                <div className="col-12">
                  <div className="alert alert-danger py-2">{error}</div>
                </div>
              )}
              <div className="col-12">
                <button className="btn btn-success" disabled={creating}>
                  {creating ? "Creating…" : "Create Resume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-secondary">Loading…</p>
      ) : resumes.length === 0 ? (
        <p className="text-secondary">
          No resumes yet. Create one to get started.
        </p>
      ) : (
        <div className="list-group">
          {resumes.map((r) => (
            <Link
              key={r.id}
              href={`/resumes/${r.id}`}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            >
              <span>{r.title}</span>
              <small className="text-secondary">
                Updated {new Date(r.updatedAt).toLocaleString()}
              </small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
