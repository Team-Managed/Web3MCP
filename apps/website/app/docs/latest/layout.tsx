import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | Web3MCP",
  description: "Web3MCP protocol reference for Solana program publishers and agent hosts.",
  alternates: { canonical: "/docs/latest" },
  openGraph: {
    title: "Web3MCP Documentation",
    description: "The Web3MCP protocol reference for Solana program publishers and agent hosts.",
    type: "website",
    siteName: "Web3MCP",
    url: "/docs/latest",
  },
};

export default function DocsLatestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
