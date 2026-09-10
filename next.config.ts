import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/*.png",
      },
    ],
  },
  // Self-contained build output (.next/standalone + a minimal server.js) so the
  // production Docker image ships only traced runtime deps. The runner serves
  // with `node server.js` instead of `next start`.
  output: "standalone",
  experimental: {
    // forbidden() (used by AuthGuard for real 403s) requires this experimental
    // flag; pairs with app/forbidden.tsx.
    authInterrupts: true,
    serverActions: {
      // Server Actions cap request bodies at 1MB by default, which a phone
      // photo clears on its own. A body over THIS limit is rejected by Next
      // before the action runs, so it can only ever surface as a thrown
      // error — which is why it sits comfortably above MAX_IMAGE_BYTES
      // (10MiB) rather than level with it. Multipart adds only ~10-20KB of
      // boundaries and part headers; the rest of the margin is deliberate, so
      // a slightly-oversized photo lands on the readable size message instead
      // of the error boundary.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
