import runner from '../data/comfyRunner.json';

const comfyRunner = runner as {
  name: string;
  status: string;
  purpose: string;
  safe_mode: boolean;
  endpoint_env: string;
  default_endpoint: string;
  input_batch: string;
  dry_run_output: string;
  runner_rules: string[];
  future_send_mode_requirements: string[];
  healthcheck: {
    enabled_by_flag_only: boolean;
    path: string;
    timeout_ms: number;
  };
};

function ListBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="dialogue-box">
      <p className="eyebrow">{title}</p>
      {items.map((item) => <p key={item}>• {item}</p>)}
    </div>
  );
}

export function ComfyRunner() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">ComfyUI Runner</p>
          <h2>{comfyRunner.name}</h2>
        </div>
        <button className="primary-button">Dry Run Only</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Status</p><strong>{comfyRunner.status}</strong><span>no real render send</span></div></div>
        <div className="stat-card"><div><p>Safe Mode</p><strong>{String(comfyRunner.safe_mode)}</strong><span>default behavior</span></div></div>
        <div className="stat-card"><div><p>Endpoint</p><strong>{comfyRunner.endpoint_env}</strong><span>{comfyRunner.default_endpoint}</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>{comfyRunner.purpose}</h2>
        <p className="body-copy">This runner validates the batch and writes a local preview file before any real ComfyUI sending is allowed.</p>
      </div>

      <div className="grid two-col">
        <ListBox title="Runner Rules" items={comfyRunner.runner_rules} />
        <ListBox title="Future Send Requirements" items={comfyRunner.future_send_mode_requirements} />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Local Commands</p>
            <h3>Validate Batch Without Rendering</h3>
          </div>
        </div>
        <div className="prompt-box">npm run comfy:dry-run</div>
        <p className="body-copy">Input: {comfyRunner.input_batch}</p>
        <p className="body-copy">Output: {comfyRunner.dry_run_output}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Optional Healthcheck</p>
            <h3>Check ComfyUI Connection</h3>
          </div>
        </div>
        <div className="prompt-box">COMFYUI_URL=http://127.0.0.1:8188 npm run comfy:dry-run -- --health</div>
        <p className="body-copy">Health path: {comfyRunner.healthcheck.path} · Timeout: {comfyRunner.healthcheck.timeout_ms}ms</p>
      </div>
    </section>
  );
}
