import toolRadar from '../data/toolRadar.json';

type ToolCandidate = {
  id: string;
  name: string;
  repo: string;
  category: string;
  fit: string;
  implementation_phase: string;
  why_it_matters: string;
  use_for: string[];
  risk: string;
  decision: string;
};

const tools = toolRadar as ToolCandidate[];
const phaseOrder = ['next', 'soon', 'after_keyframes', 'later_test', 'optional', 'do_not_integrate_now'];
const sortedTools = [...tools].sort((a, b) => phaseOrder.indexOf(a.implementation_phase) - phaseOrder.indexOf(b.implementation_phase));

export function ToolRadar() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Tool Radar</p>
          <h2>GitHub building blocks for the Comic Video Machine</h2>
        </div>
        <button className="primary-button">Inspect Next Tool</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Candidates</p><strong>{tools.length}</strong><span>researched blocks</span></div></div>
        <div className="stat-card"><div><p>Implement Next</p><strong>{tools.filter((tool) => tool.implementation_phase === 'next').length}</strong><span>highest priority</span></div></div>
        <div className="stat-card"><div><p>Reference Only</p><strong>{tools.filter((tool) => tool.fit === 'reference_only').length}</strong><span>do not copy blindly</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Decision</p>
        <h2>Do not bolt random AI demos onto the app.</h2>
        <p className="body-copy">The dashboard stays the production brain. External tools only plug in as renderer, voice, subtitle or assembly adapters.</p>
      </div>

      <div className="page-stack">
        {sortedTools.map((tool) => (
          <article className="card" key={tool.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{tool.category} · {tool.fit} · {tool.implementation_phase}</p>
                <h3>{tool.name}</h3>
              </div>
              <span className="status-badge">{tool.implementation_phase}</span>
            </div>

            <div className="prompt-box">{tool.repo}</div>

            <div className="spec-grid">
              <div><span>Why it matters</span><p>{tool.why_it_matters}</p></div>
              <div><span>Risk</span><p>{tool.risk}</p></div>
              <div><span>Decision</span><p>{tool.decision}</p></div>
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Use For</p>
              {tool.use_for.map((item) => <p key={item}>• {item}</p>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
