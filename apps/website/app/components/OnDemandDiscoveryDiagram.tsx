import { ArrowLeftRight, Bot, Database, Images, Landmark, Radio, Server } from "lucide-react";

const apps = [
  { name: "Swap", Icon: ArrowLeftRight },
  { name: "Lending", Icon: Landmark },
  { name: "NFTs", Icon: Images },
];

export default function OnDemandDiscoveryDiagram() {
  return (
    <div
      className="integration-diagram"
      role="img"
      aria-label="Legacy MCP installs separate swap, lending, and NFT server integrations into the agent host. With Web3MCP, the agent host reaches out through Solana RPC to discover each compatible program's config on demand."
    >
      <div className="integration-lane legacy-lane">
        <div className="lane-heading">
          <span><Server size={15} aria-hidden="true" /> Legacy MCP</span>
          <span>Install into host</span>
        </div>
        <div className="lane-flow">
          <div className="agent-node"><Bot size={23} aria-hidden="true" /><span>AGENT HOST</span><small>3 INSTALLED</small></div>
          <div className="flow-arrow" aria-hidden="true" />
          <div className="app-list">
            {apps.map(({ name, Icon }) => (
              <div className="app-node" key={name}>
                <Icon size={16} aria-hidden="true" />
                <span>{name}</span>
                <small>MCP server</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="integration-lane web3-lane">
        <div className="lane-heading">
          <span><Database size={15} aria-hidden="true" /> Web3MCP</span>
          <span>Discover on demand</span>
        </div>
        <div className="lane-flow">
          <div className="agent-node"><Bot size={23} aria-hidden="true" /><span>AGENT HOST</span></div>
          <div className="flow-arrow" aria-hidden="true" />
          <div className="app-list">
            <div className="rpc-label"><Radio size={14} aria-hidden="true" /> SOLANA RPC</div>
            {apps.map(({ name, Icon }) => (
              <div className="app-node" key={name}>
                <Icon size={16} aria-hidden="true" />
                <span>{name}</span>
                <small>Config PDA</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .integration-diagram {
          width: 100%;
          max-width: 560px;
          font-family: var(--font-sans);
        }

        .integration-lane {
          padding: 15px 0 18px;
          border-top: 1px solid #303030;
        }

        .web3-lane {
          border-color: #3b8b70;
        }

        .lane-heading,
        .lane-heading span:first-child {
          display: flex;
          align-items: center;
        }

        .lane-heading {
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 13px;
          color: #b9b9b9;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.04em;
        }

        .lane-heading span:first-child {
          gap: 8px;
          color: #fca5a5;
          font-weight: 700;
          text-transform: uppercase;
        }

        .web3-lane .lane-heading span:first-child {
          color: #8af4c5;
        }

        .lane-flow {
          display: grid;
          grid-template-columns: 100px 38px minmax(0, 1fr);
          align-items: center;
          gap: 12px;
        }

        .agent-node {
          min-height: 75px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #606060;
          border-radius: 5px;
          background: #0c0c0c;
          color: #f5f5f5;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .web3-lane .agent-node {
          border-color: #8bdaac;
        }

        .legacy-lane .agent-node {
          border-color: #a66b6b;
        }

        .agent-node small {
          color: #fca5a5;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 500;
        }

        .flow-arrow {
          height: 1px;
          background: #a3a3a3;
          position: relative;
        }

        .flow-arrow::after {
          content: "";
          position: absolute;
          top: -4px;
          right: 0;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
          border-left: 7px solid #a3a3a3;
        }

        .legacy-lane .flow-arrow {
          background: repeating-linear-gradient(90deg, #c78686 0 5px, transparent 5px 8px);
        }

        .legacy-lane .flow-arrow::after {
          left: 0;
          right: auto;
          border-left: 0;
          border-right: 7px solid #fca5a5;
        }

        .web3-lane .flow-arrow {
          background: #8bdaac;
        }

        .web3-lane .flow-arrow::after {
          border-left-color: #8bdaac;
        }

        .app-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .app-node {
          min-height: 34px;
          display: grid;
          grid-template-columns: 20px minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border: 1px solid #5b3a3e;
          border-radius: 4px;
          background: #140c0d;
          color: #f1d1d1;
          font-size: 12px;
          font-weight: 600;
        }

        .app-node small {
          color: #ba9292;
          font-size: 10px;
          font-weight: 500;
        }

        .web3-lane .app-node {
          border-color: #28634d;
          background: #0b1510;
          color: #e3fced;
        }

        .web3-lane .app-node small {
          color: #9bc7ad;
        }

        .rpc-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
          color: #8af4c5;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        @media (max-width: 560px) {
          .lane-flow {
            grid-template-columns: 80px 22px minmax(0, 1fr);
            gap: 7px;
          }

          .agent-node {
            font-size: 10px;
          }

          .app-node {
            grid-template-columns: 18px minmax(0, 1fr);
            gap: 5px;
            padding: 6px;
          }

          .app-node small {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
