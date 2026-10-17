"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, BookOpen, Layers } from "lucide-react";

export default function GetInvolved() {
  return (
    <section className="get-involved-section" aria-labelledby="getInvolvedTitle">
      <div className="section-inner">
        <header className="get-involved-header">
          <h2 id="getInvolvedTitle" className="section-title">Get involved with Web3MCP</h2>
        </header>

        <ul className="involved-grid">
          <li className="involved-item">
            <article className="surface-panel content-card figure-frame">
              <span className="figure-corner figure-corner--tl" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--tr" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--bl" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--br" aria-hidden="true"></span>
              <div className="card-body">
                <h3 className="card-title">Issues &amp; Contribution</h3>
                <p className="card-text">
                  Report issues, view protocol test vectors, and propose changes on{" "}
                  <a
                    href="https://github.com/Team-Managed/Web3MCP/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tech-link"
                  >
                    GitHub
                  </a>
                  .
                </p>
              </div>
            </article>
          </li>

          <li className="involved-item">
            <article className="surface-panel content-card figure-frame">
              <span className="figure-corner figure-corner--tl" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--tr" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--bl" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--br" aria-hidden="true"></span>
              <div className="card-body">
                <h3 className="card-title">Devnet Verification</h3>
                <p className="card-text">
                  Inspect the live deployed Reference Vault and canonical Config PDA on{" "}
                  <a
                    href="https://solscan.io/account/HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tech-link"
                  >
                    Solscan
                  </a>
                  .
                </p>
              </div>
            </article>
          </li>

          <li className="involved-item">
            <article className="surface-panel content-card figure-frame">
              <span className="figure-corner figure-corner--tl" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--tr" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--bl" aria-hidden="true"></span>
              <span className="figure-corner figure-corner--br" aria-hidden="true"></span>
              <div className="card-body">
                <h3 className="card-title">Documentation &amp; Guides</h3>
                <p className="card-text">
                  Explore full developer guides, quickstart walkthrough, and runtime architecture in our{" "}
                  <Link href="/docs/latest" className="tech-link">
                    Documentation
                  </Link>
                  .
                </p>
              </div>
            </article>
          </li>
        </ul>
      </div>

      <style jsx>{`
        .get-involved-section {
          width: 100%;
          padding: 80px 32px;
          position: relative;
          z-index: 10;
        }

        .section-inner {
          max-width: 1320px;
          margin: 0 auto;
        }

        .get-involved-header {
          margin-bottom: 32px;
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: clamp(2rem, 3.2vw, 2.6rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          margin: 0;
        }

        .involved-grid {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .content-card {
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .content-card:hover {
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-2px);
        }

        .card-body {
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-title {
          font-family: var(--font-sans);
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .card-text {
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.5;
          color: #94a3b8;
          margin: 0;
        }

        @media (max-width: 768px) {
          .get-involved-section {
            padding: 60px 16px;
          }
          .involved-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
