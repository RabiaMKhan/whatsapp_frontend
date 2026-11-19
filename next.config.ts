import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Hide the dev-only "N" badge: it covers the composer/user menu. Errors still show.
  devIndicators: false,
  // @chat/shared ships TypeScript source; let Next compile it.
  transpilePackages: ["@chat/shared"],
  // "/" has no page of its own: send people to the app.
  async redirects() {
    return [{ source: "/", destination: "/chat", permanent: false }];
  },
  // Production: the browser calls /api on this site and Vercel forwards it to
  // the Express API (API_PROXY_TARGET, its own Vercel project). The refresh
  // cookie is then first-party; Safari blocks cookies set by another site.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET?.replace(/\/+$/, "");
    return target ? [{ source: "/api/:path*", destination: `${target}/api/:path*` }] : [];
  },
  experimental: {
    instantInsights: {
      // Pages here sit behind client-side auth gates (the session lives in
      // browser memory), so the server can't prerender their content. Only
      // validate segments that opt in with `export const instant = true`.
      validationLevel: "manual-warning",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
