import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Standalone output for Docker (copies only the minimal needed files)
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,

  turbopack: {
    root: path.resolve(__dirname),
  },

  async rewrites() {
    // In Docker, the Next.js server proxies to the backend container.
    // NEXT_PUBLIC_API_URL is set per environment.
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
