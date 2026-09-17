import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [
        "prepforge.umair786ullah.workers.dev",
        "*.workers.dev",
        "localhost:3000",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bytebytego.com",
      },
    ],
  },
};

export default nextConfig;
