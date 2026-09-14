"use client";

import { useEffect } from "react";

/** Loads Bootstrap's JS bundle (for dropdowns, modals, etc.) client-side only. */
export default function BootstrapClient() {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);
  return null;
}
