"use client";

import { Check, X } from "lucide-react";
import OnDemandDiscoveryDiagram from "./OnDemandDiscoveryDiagram";
import CodebaseMaintenanceDiagram from "./CodebaseMaintenanceDiagram";
import ThirdPartyRiskDiagram from "./ThirdPartyRiskDiagram";

export default function WhyLegacyVsWeb3Mcp() {
  return (
    <section className="why-web3mcp-section" aria-labelledby="whySectionTitle">
      <div className="section-container">
        {/* Section Header */}
        <header className="section-header">
          <h2 id="whySectionTitle" className="section-main-title">
            Why publish tools on-chain
          </h2>
        </header>

        <div className="zigzag-rows-stack">
          <div className="zigzag-row row-normal">
            <div className="text-col">
              <div className="feature-eyebrow">
                <span className="eyebrow-num">01</span>
                <span className="eyebrow-text">Load program tools when needed.</span>
              </div>
              <h3 className="feature-title">One Protocol, Many Programs</h3>
              <div className="comparison-points">
                <div className="point-item point-legacy">
                  <div className="point-icon-box icon-legacy"><X size={12} /></div>
                  <div className="point-text">
                    <strong>Per-app MCP:</strong> Install a server for each program.
                  </div>
                </div>
                <div className="point-item point-web3mcp">
                  <div className="point-icon-box icon-web3mcp"><Check size={12} /></div>
                  <div className="point-text">
                    <strong>Web3MCP:</strong> Load compatible program tools on demand.
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-col">
              <OnDemandDiscoveryDiagram />
            </div>
          </div>

          <div className="zigzag-row row-reverse">
            <div className="text-col">
              <div className="feature-eyebrow">
                <span className="eyebrow-num">02</span>
                <span className="eyebrow-text">Keep tool definitions with the program.</span>
              </div>
              <h3 className="feature-title">Two Codebases to Maintain</h3>
              <div className="comparison-points">
                <div className="point-item point-legacy">
                  <div className="point-icon-box icon-legacy">
                    <X size={12} />
                  </div>
                  <div className="point-text">
                    <strong>Legacy MCP:</strong> Update the program and server separately.
                  </div>
                </div>
                <div className="point-item point-web3mcp">
                  <div className="point-icon-box icon-web3mcp">
                    <Check size={12} />
                  </div>
                  <div className="point-text">
                    <strong>Web3MCP:</strong> Publish tool config with program updates.
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-col">
              <CodebaseMaintenanceDiagram />
            </div>
          </div>

          <div className="zigzag-row row-normal">
            <div className="text-col">
              <div className="feature-eyebrow">
                <span className="eyebrow-num">03</span>
                <span className="eyebrow-text">Know who supplies the tools.</span>
              </div>
              <h3 className="feature-title">Third-Party Server Risk</h3>
              <div className="comparison-points">
                <div className="point-item point-legacy">
                  <div className="point-icon-box icon-legacy">
                    <X size={12} />
                  </div>
                  <div className="point-text">
                    <strong>External server:</strong> A compromised provider can change tools.
                  </div>
                </div>
                <div className="point-item point-web3mcp">
                  <div className="point-icon-box icon-web3mcp">
                    <Check size={12} />
                  </div>
                  <div className="point-text">
                    <strong>Program-owned config:</strong> The host validates tools before use.
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-col">
              <ThirdPartyRiskDiagram />
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        .why-web3mcp-section {
          width: 100%;
          padding: 120px 24px 150px;
          position: relative;
          z-index: 10;
          background: #000000;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .section-container {
          max-width: var(--site-content-inner-max);
          margin: 0 auto;
        }

        .section-header {
          max-width: 860px;
          margin: 0 auto 56px auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .section-main-title {
          font-family: var(--font-serif);
          font-size: clamp(2.4rem, 4.2vw, 3.2rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          line-height: 1.15;
          margin: 0;
        }

        /* Zigzag Rows Stack */
        .zigzag-rows-stack {
          display: flex;
          flex-direction: column;
          gap: 120px;
        }

        .zigzag-row {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 70px;
          align-items: center;
        }

        .row-reverse .text-col {
          order: 2;
        }

        .row-reverse .visual-col {
          order: 1;
        }

        /* Text Column */
        .text-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-eyebrow {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #888888;
        }

        .eyebrow-num {
          font-weight: 700;
          color: #a3a3a3;
        }

        .eyebrow-text {
          font-weight: 600;
          color: #e2e8f0;
        }

        .feature-title {
          font-family: var(--font-serif);
          font-size: clamp(1.6rem, 2.4vw, 2.1rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          line-height: 1.25;
          margin: 0;
        }

        /* Comparison Points */
        .comparison-points {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-top: 4px;
        }

        .point-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 4px;
          font-family: var(--font-sans);
          font-size: 14px;
          line-height: 1.45;
          background: #080808;
          border: 1px solid #1c1c1c;
        }

        .point-legacy {
          color: #a3a3a3;
        }

        .point-legacy strong {
          color: #fca5a5;
        }

        .point-web3mcp {
          color: #e2e8f0;
        }

        .point-web3mcp strong {
          color: #6ee7b7;
        }

        .point-web3mcp code {
          font-family: var(--font-mono);
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          padding: 1px 4px;
          border-radius: 2px;
          font-size: 12px;
        }

        .point-icon-box {
          width: 18px;
          height: 18px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #141414;
          color: #a3a3a3;
        }

        .visual-col {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Responsive Layout */
        @media (max-width: 1024px) {
          .zigzag-row {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .row-reverse .text-col {
            order: 1;
          }

          .row-reverse .visual-col {
            order: 2;
          }

          .zigzag-rows-stack {
            gap: 90px;
          }

          .why-web3mcp-section {
            padding: 100px 16px 120px;
          }
        }
      `}</style>
    </section>
  );
}
