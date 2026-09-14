import Link from "next/link";

export default function Home() {
  return (
    <div className="row justify-content-center">
      <div className="col-lg-8 text-center py-5">
        <h1 className="display-5 fw-bold mb-3">TraceCV</h1>
        <p className="lead text-secondary mb-4">
          AI Resume Builder &amp; Versioning Engine. Maintain a single source
          of truth JSON profile, update it with natural language, and render
          it into any HTML template.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link href="/resumes" className="btn btn-primary btn-lg">
            View Resumes
          </Link>
          <Link href="/templates" className="btn btn-outline-secondary btn-lg">
            Manage Templates
          </Link>
        </div>
      </div>
    </div>
  );
}
