import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Abaikan error TypeScript saat build deploy
    ignoreBuildErrors: true,
  },
  eslint: {
    // Abaikan error ESLint saat build deploy
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;