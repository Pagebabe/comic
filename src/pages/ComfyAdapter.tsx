import adapter from '../data/comfyAdapter.json';

const comfy = adapter as {
  name: string;
  status: string;
  purpose: string;
  endpoint_env: string;
  default_endpoint: string;
  batch_mode: string;
  why_comfyui: string[];
  input_sources: string[];
  output_targets: string[];
  workflow_slots: string[];
  render_rules: string[];
  first_batch_goal: string;
};

function ListBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="dialogue-box">
      <p className="eyebrow">{title}</p>
      {items.map((item) => <p key={item}>• {item}</p>)}
    </div>
  );
}

export function ComfyAdapter() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">ComfyUI Adapter</p>
          <h2>{comfy.name}</h2>
        </div>
        <button className="primary-button">Create Batch Plan</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Status</p><strong>{comfy.status}</strong><span>{comfy.batch_mode}</span></div></div>
        <div className="stat-card"><div><p>Endpoint Env</p><strong>{comfy.endpoint_env}</strong><span>{comfy.default_endpoint}</span></div></div>
        <div className="stat-card"><div><p>Workflow Slots</p><strong>{comfy.workflow_slots.length}</strong><span>mapped inputs</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">First Batch Goal</p>
        <h2>{comfy.first_batch_goal}</h2>
        <p className="body-copy">{comfy.purpose}</p>
      </div>

      <div className="grid two-col">
        <ListBox title="Why ComfyUI" items={comfy.why_comfyui} />
        <ListBox title="Render Rules" items={comfy.render_rules} />
        <ListBox title="Input Sources" items={comfy.input_sources} />
        <ListBox title="Output Targets" items={comfy.output_targets} />
        <ListBox title="Workflow Slots" items={comfy.workflow_slots} />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Local Command</p>
            <h3>Generate ComfyUI Batch Plans</h3>
          </div>
        </div>
        <div className="prompt-box">npm run create:comfy-batch</div>
        <p className="body-copy">Outputs: outputs/pilot/jobs/comfyui/ep001_comfyui_repair_batch.json and ep001_comfyui_keyframe_batch.json</p>
      </div>
    </section>
  );
}
