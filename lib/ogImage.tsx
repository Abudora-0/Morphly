import { M_BANDS, M_PATH, BRAND_COLORS } from "@/lib/brand";

// Shared render logic for opengraph-image.tsx and twitter-image.tsx, so the
// two file conventions can't drift apart. Satori (which next/og's
// ImageResponse renders through) doesn't reliably support clip-path, so the
// M-mark's three color bands are windowed via each SVG's own `viewBox`
// instead of the clipPath technique Wordmark.tsx uses in the DOM, same
// visual result, using only flexbox + native SVG viewBox math, both of
// which Satori supports solidly.
export function renderBrandImage() {
  const markSize = 300;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BRAND_COLORS.paper,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
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
        <div
          style={{
            display: "flex",
            marginLeft: -10,
            fontSize: 260,
            fontWeight: 700,
            color: BRAND_COLORS.ink,
          }}
        >
          orphly
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginTop: 40,
          fontSize: 32,
          letterSpacing: 6,
          color: BRAND_COLORS.inkSoft,
        }}
      >
        <div style={{ display: "flex" }}>AI TEXT</div>
        {/* Drawn rather than typed: the fallback font Satori resolves for a
            "→" glyph is not guaranteed to carry one. */}
        <svg width={34} height={34} viewBox="0 0 16 16">
          <path
            d="M2 8h12M9.5 3.5 14 8l-4.5 4.5"
            fill="none"
            stroke={BRAND_COLORS.inkSoft}
            strokeWidth={1.5}
          />
        </svg>
        <div style={{ display: "flex" }}>NATIVE OFFICE FILES</div>
      </div>
    </div>
  );
}
