import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to THIS project dir. Without it, a stray
  // ~/pnpm-workspace.yaml makes Next infer the home dir as root, dragging the
  // non-ASCII parent path ("💻 Dev-Projects", curly apostrophe) into Turbopack's
  // asset idents — which it byte-slices and panics on (char-boundary error).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
