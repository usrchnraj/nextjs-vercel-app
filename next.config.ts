import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // other Next.js config options if you add later

  eslint: {
    // ✅ allows production builds to succeed even if ESLint errors exist
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
