import { ArrowRight, Bot, Database, Server, ShieldAlert, ShieldCheck } from "lucide-react";

export default function ThirdPartyRiskDiagram() {
  return (
    <div
      className="trust-diagram"
      role="img"
      aria-label="A third-party MCP server adds separately supplied code to the agent host. Web3MCP loads program-owned config through RPC; the host validates it and asks the user to approve writes."
    >
      <div className="trust-lane legacy">
        <div className="lane-heading"><ShieldAlert size={18} aria-hidden="true" /> Third-party MCP server</div>
        <div className="flow">
          <div className="node"><Server size={24} aria-hidden="true" /><strong>External server</strong><span>Separate code source</span></div>
          <ArrowRight className="flow-arrow" size={22} aria-hidden="true" />
          <div className="node"><Bot size={24} aria-hidden="true" /><strong>Agent host</strong><span>Uses its tools</span></div>
        </div>
        <p>Compromised server code can change tool behavior.</p>
      </div>

      <div className="trust-lane web3">
        <div className="lane-heading"><ShieldCheck size={18} aria-hidden="true" /> Web3MCP</div>
        <div className="flow">
          <div className="node"><Database size={24} aria-hidden="true" /><strong>Config PDA</strong><span>Program-owned</span></div>
          <ArrowRight className="flow-arrow" size={22} aria-hidden="true" />
          <div className="node"><Bot size={24} aria-hidden="true" /><strong>Agent host</strong><span>Validates via RPC</span></div>
        </div>
        <p>Simulate first. The user approves each signature.</p>
      </div>

      <style jsx>{`
        .trust-diagram { width: 100%; max-width: 560px; font-family: var(--font-sans); }
        .trust-lane { border-top: 1px solid #765052; padding: 16px 0 19px; }
        .web3 { border-color: #3b8b70; }
        .lane-heading { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; color: #fca5a5; font-family: var(--font-mono); font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .web3 .lane-heading { color: #8af4c5; }
        .flow { display: grid; grid-template-columns: minmax(0, 1fr) 30px minmax(0, 1fr); align-items: center; gap: 12px; }
        .node { min-height: 105px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 7px; padding: 14px 18px; border: 1px solid #765052; border-radius: 5px; background: #130d0e; color: #f3dddd; }
        .node strong { font-size: 15px; line-height: 1.25; }
        .node span { color: #c69f9f; font-size: 12px; }
        .web3 .node { border-color: #34765a; background: #0b1510; color: #e3fced; }
        .web3 .node span { color: #a6d4b6; }
        .flow-arrow { color: #fca5a5; }
        .web3 .flow-arrow { color: #8af4c5; }
        p { margin: 13px 0 0; color: #d7b0b0; font-size: 13px; line-height: 1.4; }
        .web3 p { color: #b9dcc8; }
        @media (max-width: 560px) {
          .flow { grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr); gap: 7px; }
          .node { min-height: 100px; padding: 10px; }
          .node strong { font-size: 13px; }
          .node span { font-size: 11px; }
        }
      `}</style>
    </div>
  );
}
