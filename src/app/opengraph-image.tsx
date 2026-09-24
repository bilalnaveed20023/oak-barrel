import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "The Oak Barrel — 166 Oak Street, Wyandotte, Michigan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function OG() {
  // Satori needs TTF/OTF/WOFF; woff2 isn't supported, so fall back to a system serif if unavailable
  let fonts: { name: string; data: ArrayBuffer; style: "normal" | "italic"; weight: 400 }[] = [];
  try {
    const data = await readFile(join(process.cwd(), "src/fonts/Boska-400.woff"));
    fonts = [{ name: "Boska", data: data.buffer as ArrayBuffer, style: "normal", weight: 400 }];
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "radial-gradient(70% 80% at 70% 60%, #15543f 0%, #07130e 70%)",
          color: "#f1ebdd",
          fontFamily: fonts.length ? "Boska" : "serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 4, color: "#c9a25e" }}>
          <span>166 OAK STREET — WYANDOTTE, MI</span>
          <span>COCKTAILS · DISTILLATES · LIVE MUSIC</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 150, lineHeight: 0.9, letterSpacing: -5 }}>
          <span>The Oak</span>
          <span style={{ color: "#e2c58c" }}>Barrel</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
