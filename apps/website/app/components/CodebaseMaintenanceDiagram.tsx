import { ArrowRight, Database, FileCode2, RefreshCw, Server } from "lucide-react";

export default function CodebaseMaintenanceDiagram() {
  return (
    <div
      className="codebase-diagram"
      role="img"
      aria-label="An app-specific MCP integration keeps Solana program code and MCP server code in separate projects that must be updated together. Web3MCP publishes tool config from the program project to its on-chain config PDA."
    >
      <div className="diagram-track legacy-track">
        <div className="track-heading"><span>LEGACY MCP</span><span>2 codebases</span></div>
        <div className="codebase-flow">
          <div className="codebase-node">
            <FileCode2 size={23} aria-hidden="true" />
            <span>Solana program</span>
            <small>Program code</small>
          </div>
          <div className="flow-action">
            <RefreshCw size={17} aria-hidden="true" />
            <span>SYNC AGAIN</span>
          </div>
          <div className="codebase-node">
            <Server size={23} aria-hidden="true" />
            <span>MCP server</span>
            <small>Tool bindings</small>
          </div>
        </div>
      </div>

      <div className="diagram-track web3-track">
        <div className="track-heading"><span>WEB3MCP</span><span>1 program codebase</span></div>
        <div className="codebase-flow">
          <div className="codebase-node">
            <FileCode2 size={23} aria-hidden="true" />
            <span>Program + config</span>
            <small>Same project</small>
          </div>
          <div className="flow-action">
            <ArrowRight size={20} aria-hidden="true" />
            <span>PUBLISH</span>
          </div>
          <div className="codebase-node">
            <Database size={23} aria-hidden="true" />
            <span>Config PDA</span>
            <small>On-chain</small>
          </div>
        </div>
      </div>

      <style jsx>{`
        .codebase-diagram {
          width: 100%;
          max-width: 560px;
          font-family: var(--font-sans);
        }

        .diagram-track {
          padding: 16px 0 22px;
          border-top: 1px solid #765052;
        }

        .web3-track {
          border-color: #3b8b70;
        }

        .track-heading {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
          color: #b9b9b9;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.05em;
        }

        .track-heading span:first-child {
          color: #fca5a5;
          font-weight: 700;
        }

        .web3-track .track-heading span:first-child {
          color: #8af4c5;
        }

        .codebase-flow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 84px minmax(0, 1fr);
          gap: 13px;
          align-items: center;
        }

        .codebase-node {
          min-height: 98px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 7px;
          padding: 13px 16px;
          border: 1px solid #765052;
          border-radius: 5px;
          background: #130d0e;
          color: #f3dddd;
          font-size: 14px;
          font-weight: 600;
        }

        .codebase-node small {
          color: #c69f9f;
          font-size: 11px;
          font-weight: 400;
        }

        .web3-track .codebase-node {
          border-color: #34765a;
          background: #0b1510;
          color: #e3fced;
        }

        .web3-track .codebase-node small {
          color: #a6d4b6;
        }

        .flow-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          color: #fca5a5;
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.04em;
          text-align: center;
        }

        .web3-track .flow-action {
          color: #8af4c5;
        }

        @media (max-width: 560px) {
          .codebase-flow {
            grid-template-columns: minmax(0, 1fr) 50px minmax(0, 1fr);
            gap: 7px;
          }

          .codebase-node {
            min-height: 105px;
            padding: 9px;
            font-size: 12px;
          }

          .codebase-node small {
            font-size: 10px;
          }

          .flow-action {
            font-size: 8px;
          }
        }
      `}</style>
    </div>
  );
}
