import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MCP SDK Docs Assistant",
    short_name: "MCP Docs",
    description:
      "Agentic RAG assistant for the MCP TypeScript SDK — version-correct, cited, honest.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#fbfaf7",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
