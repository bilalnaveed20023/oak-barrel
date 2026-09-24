import type { NextConfig } from "next";

// PAGES=1 builds a static export for GitHub Pages, served from /oak-barrel/
const pages = process.env.PAGES === "1";
const basePath = pages ? "/oak-barrel" : "";

const nextConfig: NextConfig = {
  // let phones on the local network load dev assets (http://<mac-ip>:3050)
  allowedDevOrigins: ["10.0.0.173", "*.local"],
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(pages && {
    output: "export",
    basePath,
    trailingSlash: true,
    distDir: ".next-pages",
    images: { unoptimized: true },
  }),
};

export default nextConfig;
