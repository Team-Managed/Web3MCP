"use client";

import React from "react";
import { Server, Lock, Code2, Eye, Cpu, ShieldAlert } from "lucide-react";

export default function WhatWeDidntBuild() {
  const ITEMS = [
    {
      icon: <Server size={20} className="card-icon" />,
      title: "No Off-Chain Central Directory",
      body: "Target programs own their config PDAs. Compatible hosts discover them through Solana RPC without a project-specific registry or MCP server.",
    },
    {
      icon: <Lock size={20} className="card-icon" />,
      title: "No Model Access to Keys",
      body: "The model proposes arguments. The host simulates the transaction and asks a person to approve signing with the selected local keypair.",
    },
    {
      icon: <Code2 size={20} className="card-icon" />,
      title: "No Static Target Code Imports",
      body: "The host reads the embedded IDL from the validated on-chain config. It does not import the target program's source or local generated IDL.",
    },
    {
      icon: <Eye size={20} className="card-icon" />,
      title: "No View Instruction Hacks",
      body: "Account reads use standard Solana RPC and verify owner and discriminator. They need no wallet signature or Solana transaction fee.",
    },
    {
      icon: <Cpu size={20} className="card-icon" />,
      title: "No Framework Lock-In",
      body: "The SDK has no model dependency. The example Host CLI adds provider adapters for OpenAI, Anthropic, Gemini, Groq, and Ollama.",
    },
    {
      icon: <ShieldAlert size={20} className="card-icon" />,
      title: "No Blind Transaction Broadcasts",
      body: "The host simulates writes before approval. Its review card shows accounts, arguments, instruction data, logs, fee estimate, and publisher-claimed effects.",
    },
  ];

  return (
    <section className="not-built-section" aria-labelledby="notBuiltTitle">
      <div className="section-inner">
        <header className="not-built-header">
          <h2 id="notBuiltTitle" className="not-built-title">What we didn&apos;t build</h2>
          <p className="not-built-desc">
            Web3MCP defines on-chain discovery and execution bindings. Hosts choose their own model, UI, and wallet integration.
          </p>
        </header>

        <ul className="cards-grid">
          {ITEMS.map((item, idx) => (
            <li key={idx} className="feature-card figure-frame">
              <span className="figure-corner figure-corner--tl" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--tr" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--bl" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--br" aria-hidden="true"></span>

              <div className="card-inner">
                <div className="icon-wrap">{item.icon}</div>
                <h3 className="card-heading">{item.title}</h3>
                <p className="card-body-text">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .not-built-section {
          width: 100%;
          padding: 80px 32px 100px 32px;
          position: relative;
          z-index: 10;
          background: rgba(4, 4, 6, 0.7);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .section-inner {
          max-width: 1320px;
          margin: 0 auto;
        }

        .not-built-header {
          max-width: 760px;
          margin-bottom: 48px;
        }

        .not-built-title {
          font-family: var(--font-serif);
          font-size: clamp(2rem, 3.5vw, 2.8rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          margin-bottom: 14px;
        }

        .not-built-desc {
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.6;
          color: #94a3b8;
          margin: 0;
        }

        .cards-grid {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .feature-card:hover {
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
        }

        .card-inner {
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .icon-wrap {
          color: #38bdf8;
        }

        .card-heading {
          font-family: var(--font-sans);
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .card-body-text {
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.55;
          color: #94a3b8;
          margin: 0;
        }

        @media (max-width: 960px) {
          .cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .not-built-section {
            padding: 60px 16px 80px 16px;
          }
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
