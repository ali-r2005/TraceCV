import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" href="/">
          <span>TraceCV</span>
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto align-items-center gap-1">
            <li className="nav-item">
              <Link className="nav-link" href="/resumes">
                Resumes
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/templates">
                Templates
              </Link>
            </li>
            <li className="nav-item ms-lg-2">
              <Link className="btn btn-sm btn-outline-info px-3" href="/admin/templates">
                Admin Portal
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
