"use client";

import Link from "next/link";
import { ArrowRight, Bot, Database, FileCode2 } from "lucide-react";

export default function HomeStoryGrid() {
  return (
    <section className="home-story-section" aria-labelledby="storySectionTitle">
      <div className="section-container">
        <header className="section-header">
          <h2 id="storySectionTitle">How Web3MCP works</h2>
        </header>

        <div className="architecture" aria-label="The vault program publishes a config PDA, which an agent host reads through RPC">
          <div className="endpoint program">
            <FileCode2 size={28} strokeWidth={1.5} aria-hidden="true" />
            <span className="endpoint-label">SOLANA PROGRAM</span>
            <h3>Reference vault</h3>
            <code>9zJz…iXRwD</code>
          </div>

          <div className="connector" aria-hidden="true"><span>publishes</span><ArrowRight size={24} /></div>

          <div className="config-panel">
            <div className="config-heading">
              <Database size={26} strokeWidth={1.5} aria-hidden="true" />
              <div><span>ON-CHAIN ACCOUNT</span><h3>Config PDA</h3></div>
              <span className="config-status">PROGRAM OWNED</span>
            </div>
            <div className="config-code-label">SHORTENED EXAMPLE · TOOLS + IDL</div>
            <pre aria-label="Shortened example of Web3MCP config PDA data"><code>{`{
  "standard": "web3mcp",
  "version": "0.2.0",
  "programId": "9zJz…iXRwD",
  "tools": [
    {
      "name": "get_vault_by_owner",
      "solana": { "kind": "accountRead" }
    },
    {
      "name": "deposit",
      "solana": { "kind": "instruction" }
    }
  ],
  "idl": { "…": "schemas" }
}`}</code></pre>
          </div>

          <div className="connector" aria-hidden="true"><span>RPC read</span><ArrowRight size={24} /></div>

          <div className="endpoint host">
            <Bot size={28} strokeWidth={1.5} aria-hidden="true" />
            <span className="endpoint-label">AGENT HOST + SDK</span>
            <h3>Discover tools</h3>
            <div className="host-path">Derive PDA from program ID</div>
            <div className="host-path">Validate config, then load tools</div>
          </div>
        </div>

        <Link className="protocol-link" href="/docs/latest">Explore the protocol <ArrowRight size={17} aria-hidden="true" /></Link>
      </div>

      <style jsx>{`
        .home-story-section { background: #030507; border-top: 1px solid rgba(255,255,255,.08); padding: 110px 24px 75px; }
        .section-container { max-width: var(--site-content-inner-max); margin: 0 auto; }
        .section-header { margin-bottom: 46px; }
        .section-header h2 { margin: 0; color: #fff; font-family: var(--font-serif); font-size: clamp(2.4rem, 4.2vw, 3.2rem); font-weight: 500; line-height: 1.15; letter-spacing: -.015em; }
        .architecture { display: grid; grid-template-columns: minmax(0,1fr) 50px minmax(0,1.8fr) 50px minmax(0,1fr); align-items: center; gap: 15px; }
        .endpoint { min-height: 260px; display: flex; flex-direction: column; align-items: flex-start; padding: 27px 24px; color: #98ecca; border: 1px solid #37574a; background: #0b1511; }
        .endpoint-label, .config-heading span, .config-code-label { font-family: var(--font-mono); font-size: 12px; font-weight: 700; letter-spacing: .05em; }
        .endpoint-label { margin-top: 30px; color: #8ed6b5; }
        .endpoint h3, .config-heading h3 { margin: 7px 0 0; color: #fff; font-family: var(--font-sans); font-weight: 650; }
        .endpoint h3 { font-size: 21px; line-height: 1.25; }
        .endpoint code { margin-top: 9px; color: #b7c5be; font-family: var(--font-mono); font-size: 14px; }
        .host { background: #10111a; border-color: #55516b; color: #c5b5ed; }
        .host .endpoint-label { color: #c3b0ec; }
        .host-path { margin-top: 17px; color: #c9c7d4; font-family: var(--font-sans); font-size: 14px; line-height: 1.35; }
        .host-path:first-of-type { margin-top: auto; }
        .connector { display: flex; flex-direction: column; align-items: center; gap: 9px; color: #75dcb0; }
        .connector span { color: #b6c8bd; font-family: var(--font-sans); font-size: 12px; white-space: nowrap; }
        .config-panel { min-width: 0; padding: 24px; border: 1px solid #7ab999; background: linear-gradient(145deg,#0d1b16 0%,#08100f 60%,#12101b 100%); box-shadow: 0 12px 40px rgba(0,0,0,.28); }
        .config-heading { display: flex; align-items: center; gap: 13px; color: #8ff0bd; }
        .config-heading div { min-width: 0; }
        .config-heading span { color: #93d2b0; }
        .config-heading h3 { font-size: 22px; }
        .config-heading .config-status { margin-left: auto; padding: 6px 8px; border: 1px solid #3b815e; color: #a5ecc1; font-size: 10px; white-space: nowrap; }
        .config-code-label { margin: 25px 0 9px; color: #b6c8be; font-size: 11px; }
        .config-panel pre { max-width: 100%; margin: 0; overflow-x: auto; padding: 17px 14px; color: #d5eadc; border: 1px solid #30483d; background: #050b09; font-family: var(--font-mono); font-size: 12px; line-height: 1.65; tab-size: 2; }
        .protocol-link { display: inline-flex; align-items: center; gap: 9px; margin-top: 29px; color: #a8ecc7; font-family: var(--font-sans); font-size: 15px; text-decoration: none; }
        .protocol-link:hover { color: #fff; }
        .protocol-link:focus-visible { outline: 2px solid #a8ecc7; outline-offset: 5px; }
        @media (max-width: 1050px) {
          .architecture { grid-template-columns: 1fr; gap: 12px; }
          .endpoint { min-height: 0; }
          .endpoint-label { margin-top: 14px; }
          .host-path:first-of-type { margin-top: 20px; }
          .connector { flex-direction: row; justify-content: center; min-height: 35px; }
          .connector :global(svg) { transform: rotate(90deg); }
          .config-panel pre { font-size: 13px; }
        }
        @media (max-width: 700px) {
          .home-story-section { padding: 80px 16px 70px; }
          .section-header { margin-bottom: 32px; }
          .config-panel { padding: 18px 14px; }
          .config-heading .config-status { display: none; }
          .config-panel pre { font-size: 11px; }
        }
      `}</style>
    </section>
  );
}
