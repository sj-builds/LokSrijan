import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 writes editor-tooling Markdown files into this directory on every
  // `next dev`, and re-creates them if deleted. We keep generated files out of
  // the repository.
  agentRules: false,
};

export default nextConfig;
