import adapter from '../data/remotionAdapter.json';

const remotion = adapter as {
  name: string;
  status: string;
  purpose: string;
  why_remotion: string[];
  composition: {
    id: string;
    width: number;
    height: number;
    fps: number;
    duration_seconds_target: number;
    format: string;
  };
  input_sources: string[];
  render_layers: string[];
  implementation_steps: string[];
  do_not_do_yet: string[];
  first_render_goal: string;
};

function ListBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="dialogue-box">
      <p className="eyebrow">{title}</p>
      {items.map((item) => <p key={item}>• {item}</p>)}
    </div>
  );
}

export function RemotionAdapter() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Remotion Adapter</p>
          <h2>{remotion.name}</h2>
        </div>
        <button className="primary-button">Create Remotion Plan</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Status</p><strong>{remotion.status}</strong><span>adapter stage</span></div></div>
        <div className="stat-card"><div><p>Canvas</p><strong>{remotion.composition.width}×{remotion.composition.height}</strong><span>{remotion.composition.format}</span></div></div>
        <div className="stat-card"><div><p>FPS</p><strong>{remotion.composition.fps}</strong><span>{remotion.composition.duration_seconds_target}s target</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>{remotion.purpose}</h2>
        <p className="body-copy">{remotion.first_render_goal}</p>
      </div>

      <div className="grid two-col">
        <ListBox title="Why Remotion" items={remotion.why_remotion} />
        <ListBox title="Render Layers" items={remotion.render_layers} />
        <ListBox title="Input Sources" items={remotion.input_sources} />
        <ListBox title="Implementation Steps" items={remotion.implementation_steps} />
        <ListBox title="Do Not Do Yet" items={remotion.do_not_do_yet} />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Local Command</p>
            <h3>Generate Remotion Timeline Plan</h3>
          </div>
        </div>
        <div className="prompt-box">npm run create:remotion-plan</div>
        <p className="body-copy">Output: outputs/pilot/assembly/ep001_remotion_plan.json</p>
      </div>
    </section>
  );
}
