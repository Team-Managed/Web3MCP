import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quickstart | Web3MCP",
  description: "Discover a Solana program's published tools with the Web3MCP Node.js SDK.",
  alternates: { canonical: "/quickstart" },
  openGraph: {
    title: "Web3MCP Quickstart",
    description: "Discover a Solana program's published tools with the Web3MCP Node.js SDK.",
    type: "website",
    siteName: "Web3MCP",
    url: "/quickstart",
  },
};

export default function QuickstartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
