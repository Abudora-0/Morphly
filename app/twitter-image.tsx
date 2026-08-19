import { ImageResponse } from "next/og";
import { renderBrandImage } from "@/lib/ogImage";

export const alt = "Morphly: paste AI output, export native Office files";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(renderBrandImage(), { ...size });
}
