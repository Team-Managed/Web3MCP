"use client";

import { Bot, FileCode2, ShieldCheck } from "lucide-react";

export default function SecurityByDesign() {
  return (
    <section className="security-section" aria-labelledby="securityTitle">
      <div className="section-inner">
        <header className="security-header">
          <h2 id="securityTitle">Security by design</h2>
        </header>

        <div className="security-grid">
          <article className="security-panel">
            <div className="panel-label"><span>FOR PROGRAM DEVELOPERS</span><FileCode2 size={25} aria-hidden="true" /></div>
            <h3>Publish without a separate server</h3>
            <p>The program publishes declarative tools to a config PDA it owns.</p>
          </article>

          <article className="security-panel">
            <div className="panel-label"><span>FOR AGENT HOSTS</span><Bot size={25} aria-hidden="true" /></div>
            <h3>Integrate once with the SDK</h3>
            <p>The SDK validates the program and its published tools before use.</p>
          </article>
        </div>

        <div className="approval-strip">
          <ShieldCheck size={29} aria-hidden="true" />
          <div>
            <h3>The wallet stays in the user&apos;s hands</h3>
            <p>The model cannot sign. You approve each transaction after simulation.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .security-section {
          width: 100%;
          padding: 100px 24px 110px;
          background: #050708;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .section-inner { max-width: var(--site-content-inner-max); margin: 0 auto; }
        .security-header { margin-bottom: 48px; }
        .security-header h2 {
          margin: 0;
          color: #fff;
          font-family: var(--font-serif);
          font-size: clamp(2.4rem, 4.2vw, 3.2rem);
          font-weight: 500;
          letter-spacing: -0.015em;
        }
        .security-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
        .security-panel {
          display: flex;
          flex-direction: column;
          padding: 30px;
          border: 1px solid #2e4a42;
          border-radius: 5px;
          background: #09120f;
        }
        .panel-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 35px;
          color: #8be6bc;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .security-panel h3 {
          margin: 0 0 12px;
          color: #fff;
          font-family: var(--font-sans);
          font-size: 23px;
          font-weight: 600;
          line-height: 1.25;
        }
        .security-panel p {
          margin: 0;
          color: #b5cfc0;
          font-family: var(--font-sans);
          font-size: 16px;
          line-height: 1.6;
        }
        .approval-strip {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-top: 24px;
          padding: 25px 30px;
          border: 1px solid #3e5f55;
          border-radius: 5px;
          color: #9beec6;
          background: #0b1813;
        }
        .approval-strip h3 {
          margin: 0 0 7px;
          color: #fff;
          font-family: var(--font-sans);
          font-size: 18px;
          font-weight: 600;
        }
        .approval-strip p {
          margin: 0;
          color: #b5cfc0;
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.5;
        }
        @media (max-width: 700px) {
          .security-section { padding: 80px 16px 90px; }
          .security-grid { grid-template-columns: 1fr; gap: 16px; }
          .security-panel { padding: 24px; }
          .panel-label { margin-bottom: 28px; }
          .approval-strip { align-items: flex-start; padding: 22px; }
        }
      `}</style>
    </section>
  );
}
