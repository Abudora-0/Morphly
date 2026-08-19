import type { MetadataRoute } from "next";
import { BRAND_COLORS } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Morphly",
    short_name: "Morphly",
    description: "Paste raw text or AI-generated output, export a native .docx, .xlsx, or .pptx file.",
    // Lands on the marketing page even from a home-screen icon, not straight
    // into the tool, matching the whole point of the landing/tool split.
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLORS.paper,
    theme_color: BRAND_COLORS.ink,
    // apple-icon.tsx already injects its own <link rel="apple-touch-icon">
    // tag automatically (at a hashed, non-predictable URL), so it doesn't need
    // (and can't reliably be) listed here too. This covers Android/Chrome's
    // "Add to Home Screen" affordance.
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
