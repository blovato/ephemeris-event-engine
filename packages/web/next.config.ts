import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Keep existing export configuration
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*", // Match all requests to /api
        destination: "http://localhost:8080/api/:path*", // Proxy to your local server
      },
    ];
  },
};

export default nextConfig;
