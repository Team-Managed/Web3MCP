import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web3MCP — The Open Tool Protocol for Solana AI Agents",
  description:
    "An open, on-chain tool discovery protocol for Solana programs. AI agents discover and execute verified tools directly from program-owned PDAs with strict host decoupling and human wallet signing.",
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
  openGraph: {
    title: "Web3MCP — On-Chain Tool Discovery for Solana AI Agents",
    description:
      "Publish agent capabilities directly into program-owned Solana PDAs. Zero off-chain servers. Cryptographically verified. Wallet-approved execution.",
    type: "website",
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
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..800;1,400..800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
