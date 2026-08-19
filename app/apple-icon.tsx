import { ImageResponse } from "next/og";
import { M_BANDS, M_PATH, BRAND_COLORS } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applies its own rounded-square mask, so the image itself stays a flat
// square, no pre-rounded corners.
export default function Icon() {
  const markSize = 128;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BRAND_COLORS.paper,
        }}
      >
        <div style={{ display: "flex", width: markSize, height: markSize }}>
          {M_BANDS.map((band) => (
            <svg
              key={band.minX}
              width={(markSize * band.width) / 100}
              height={markSize}
              viewBox={`${band.minX} 0 ${band.width} 100`}
            >
              <path d={M_PATH} fill={band.color} />
            </svg>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
