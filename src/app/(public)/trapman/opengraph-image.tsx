import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "TrapMan by Nobilix — Run the neon city";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/assets/trapman-logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

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
          background: "#030207",
          fontFamily: "sans-serif",
          gap: 24,
        }}
      >
        {/* Purple glow strip */}
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
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={160} height={160} style={{ display: "block" }} />
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              display: "flex",
            }}
          >
            TRAPMAN
          </span>
          <span
            style={{
              fontSize: 32,
              color: "#39e9ff",
              letterSpacing: "0.12em",
              display: "flex",
            }}
          >
            RUN THE CITY
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
