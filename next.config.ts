import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Uploaded product/category photos served by app/uploads/[...path]/route.ts.
    localPatterns: [{ pathname: "/uploads/**", search: "" }],
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
