import type { NextConfig } from "next";

// When BACKEND_URL is set (for example on Vercel), the browser talks to "/backend/..." on this site
// and Next forwards it to the real API. Cookies then belong to this domain, which keeps sign in working
// in browsers that block third party cookies. Without it, the app calls NEXT_PUBLIC_API_URL directly.
const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  ...(BACKEND_URL ? { env: { NEXT_PUBLIC_API_URL: "/backend" } } : {}),
  async rewrites() {
    return BACKEND_URL ? [{ source: "/backend/:path*", destination: `${BACKEND_URL}/:path*` }] : [];
  },
  cacheComponents: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
