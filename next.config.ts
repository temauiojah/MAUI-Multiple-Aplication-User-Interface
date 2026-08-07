import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for XMTP Browser SDK (WASM)
  serverExternalPackages: ["@xmtp/browser-sdk", "@xmtp/wasm-bindings"],

  // Silence the Turbopack / webpack conflict
  turbopack: {},
};

export default nextConfig;
