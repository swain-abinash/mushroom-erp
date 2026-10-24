import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: false,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    // Uploaded product/category photos served by app/uploads/[...path]/route.ts, plus external CDN images.
    localPatterns: [{ pathname: "/uploads/**", search: "" }],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: {
    // Product forms upload up to 5 images × 4 MB; leave headroom for multipart overhead.
    serverActions: { bodySizeLimit: "22mb" },
    // proxy.ts runs on /admin/*, so it buffers those request bodies too (default 10 MB).
    proxyClientMaxBodySize: "22mb",
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
