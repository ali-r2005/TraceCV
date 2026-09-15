import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import NavBar from "@/components/NavBar";
import BootstrapClient from "@/components/BootstrapClient";

export const metadata: Metadata = {
  title: "TraceCV — AI Resume Builder & Versioning Engine",
  description:
    "AI-assisted resume versioning platform built on a single source of truth JSON profile.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-bs-theme="light">
      <body>
        <NavBar />
        <main className="container-fluid py-4">{children}</main>
        <BootstrapClient />
      </body>
    </html>
  );
}
