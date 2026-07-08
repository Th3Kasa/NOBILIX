import { ImageResponse } from "next/og";

// Applies to the whole (public) segment tree (home, /legal and its pages)
// EXCEPT /trapman/*, which has its own scoped override at
// `(public)/trapman/opengraph-image.tsx` — TrapMan is a distinct brand
// (saturated neon arcade) and must not inherit this Nobilix studio image.
export const alt = "Nobilix — an independent technology studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#07090d",
          fontFamily: "sans-serif",
          gap: 28,
        }}
      >
        {/* Neon gradient hairline — same identity strip as the studio site */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #8c27ff, #f144ff, #39e9ff)",
            display: "flex",
          }}
        />
        <span
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: "#39e9ff",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Nobilix
        </span>
        <span
          style={{
            fontSize: 104,
            fontWeight: 800,
            color: "#f4f0e8",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            display: "flex",
          }}
        >
          NOBILIX
        </span>
        <span
          style={{
            fontSize: 30,
            color: "rgba(244, 240, 232, 0.68)",
            letterSpacing: "0.01em",
            display: "flex",
          }}
        >
          Independent technology studio
        </span>
      </div>
    ),
    { ...size },
  );
}
