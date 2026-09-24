import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // let phones on the local network load dev assets (http://<mac-ip>:3050)
  allowedDevOrigins: ["10.0.0.173", "*.local"],
};

export default nextConfig;
