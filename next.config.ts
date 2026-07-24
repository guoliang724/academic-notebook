import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude better-sqlite3 native module from webpack bundling
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
