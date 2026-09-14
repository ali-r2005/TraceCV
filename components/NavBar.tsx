import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-semibold" href="/">
          TraceCV
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
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
          </ul>
        </div>
      </div>
    </nav>
  );
}
