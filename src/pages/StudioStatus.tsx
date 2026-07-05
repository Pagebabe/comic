import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type FileStatus = {
  path: string;
  required: boolean;
  exists: boolean;
  status: string;
};

type PilotUiStatus = {
  id: string;
  createdAt: string;
  ok: boolean;
  missingRequired: number;
  required: FileStatus[];
  published: FileStatus[];
  stats: {
    panels: number;
    productionCounts: Record<string, number>;
    reviewItems: number;
    reviewSkipped: number;
    publishedAssets: number;
    missingAssets: number;
  };
  routes: string[];
  refreshCommand: string;
  nextStep: string;
};

const emptyStatus: PilotUiStatus = {
  id: 'missing_pilot_ui_status',
  createdAt: '',
  ok: false,
  missingRequired: 0,
  required: [],
  published: [],
  stats: { panels: 0, productionCounts: {}, reviewItems: 0, reviewSkipped: 0, publishedAssets: 0, missingAssets: 0 },
  routes: ['#/pilot-control', '#/review', '#/asset-gallery', '#/studio-status'],
  refreshCommand: 'node scripts/refreshPilotUi.mjs',
  nextStep: 'Run node scripts/writePilotUiStatus.mjs.'
};

const styles: Record<string, CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' },
  row: { display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.65rem', alignItems: 'center' },
  code: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  muted: { color: 'rgba(255,255,255,0.58)', fontSize: '0.78rem' }
};

function tone(status: string) {
  if (status === 'ok') return { label: 'OK', mark: '✓' };
  if (status === 'missing_required') return { label: 'MISSING', mark: '!' };
  return { label: 'OPTIONAL', mark: '·' };
}

function FileList({ title, items }: { title: string; items: FileStatus[] }) {
  return (
    <article className="card">
      <div className="card-header"><div><p className="eyebrow">Files</p><h3>{title}</h3></div><span style={styles.muted}>{items.length}</span></div>
      <div className="page-stack">
        {items.map((item) => {
          const current = tone(item.status);
          return <div className="prompt-box" key={item.path} style={styles.row}><strong>{current.mark}</strong><span style={styles.code}>{item.path}</span><span className="topbar-pill">{current.label}</span></div>;
        })}
        {items.length === 0 && <p className="body-copy">No items.</p>}
      </div>
    </article>
  );
}

export function StudioStatus() {
  const [status, setStatus] = useState<PilotUiStatus>(emptyStatus);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/health/pilot-ui-status.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: PilotUiStatus) => { if (!cancelled) setStatus(data); })
      .catch((loadError) => { if (!cancelled) setError(String(loadError)); });
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => Object.entries(status.stats.productionCounts ?? {}).filter(([, value]) => value > 0).slice(0, 8), [status.stats.productionCounts]);
  const missingRequired = status.required.filter((item) => !item.exists);

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Studio Status</p>
          <h2>Pilot UI Health Check</h2>
          <p className="body-copy">Checks scripts, routes, public status files, review manifests and published image assets.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload Health</button>
      </div>

      {error && <div className="hero-card warning-card"><p className="eyebrow">Health report missing</p><h3>Create the public status file first.</h3><div className="prompt-box" style={styles.code}>node scripts/writePilotUiStatus.mjs</div><p style={styles.muted}>{error}</p></div>}

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Health</p><strong>{status.ok ? 'OK' : 'CHECK'}</strong><span>{status.missingRequired} required missing</span></div></div>
        <div className="stat-card"><div><p>Panels</p><strong>{status.stats.panels}</strong><span>production status</span></div></div>
        <div className="stat-card"><div><p>Review Items</p><strong>{status.stats.reviewItems}</strong><span>{status.stats.reviewSkipped} skipped</span></div></div>
        <div className="stat-card"><div><p>Assets</p><strong>{status.stats.publishedAssets}</strong><span>{status.stats.missingAssets} missing</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Next Step</p>
        <h2>{status.nextStep}</h2>
        <div className="prompt-box" style={styles.code}>{status.refreshCommand}{`\n`}node scripts/writePilotUiStatus.mjs</div>
        <button className="primary-button" type="button" onClick={() => { navigator.clipboard?.writeText(`${status.refreshCommand}\nnode scripts/writePilotUiStatus.mjs`); setCopied(true); }}>{copied ? 'Copied' : 'Copy Refresh Commands'}</button>
      </div>

      <div style={styles.grid}>
        <FileList title="Required Studio Files" items={status.required} />
        <FileList title="Published UI Data" items={status.published} />
      </div>

      <div style={styles.grid}>
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Production Counts</p><h3>Current states</h3></div></div>
          <div className="page-stack">
            {counts.map(([key, value]) => <div className="dialogue-box" key={key}><strong>{key}</strong><p>{value}</p></div>)}
            {counts.length === 0 && <p className="body-copy">No production counts published yet.</p>}
          </div>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Routes</p><h3>Open after refresh</h3></div></div>
          <div className="page-stack">
            {status.routes.map((route) => <div className="dialogue-box" key={route}>{route}</div>)}
          </div>
        </article>
      </div>

      {missingRequired.length > 0 && <article className="card"><div className="card-header"><div><p className="eyebrow">Blocking</p><h3>Missing required files</h3></div></div><div className="page-stack">{missingRequired.map((item) => <div className="prompt-box" key={item.path} style={styles.code}>{item.path}</div>)}</div></article>}
    </section>
  );
}
