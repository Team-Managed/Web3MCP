import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "./site-url";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Web3MCP — The Open Tool Protocol for Solana AI Agents",
  description:
    "A proposed on-chain tool discovery protocol for Solana programs. Compatible hosts validate program-owned config PDAs, prepare transactions, and request human approval before signing.",
  keywords: [
    "Web3MCP",
    "Solana",
    "AI Agents",
    "Model Context Protocol",
    "Anchor",
    "PDA Discovery",
    "WebMCP",
  ],
  authors: [{ name: "Web3MCP Team" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Web3MCP — On-Chain Tool Discovery for Solana AI Agents",
    description:
      "Publish tool definitions in a program-owned Solana PDA. Compatible hosts discover them through RPC and require human approval for signed transactions.",
    type: "website",
    siteName: "Web3MCP",
    url: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..800;1,400..800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
