import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type Panel = {
  panelId: string;
  state: string;
  nextAction: string;
  sceneId: string | null;
  sceneTitle: string | null;
  shotType: string | null;
  dialogue: string | null;
  render: { queueItemId: string | null; promptId: string | null; outputPath: string | null };
  review: { status: string | null; decision: string | null; primaryImage: string | null; manifestFile: string | null };
  fix: { jobCount: number; latestJobId: string | null; attempt: number | null; historyImageCount: number };
};

type StatusFile = {
  createdAt: string;
  seriesTitle: string;
  panelCount: number;
  counts: Record<string, number>;
  panels: Panel[];
};

type ReviewItem = {
  panelId: string;
  primaryImagePublicUrl?: string | null;
  publicAssetCount?: number;
  status?: string | null;
  decision?: string | null;
};

type ReviewIndex = {
  createdAt: string;
  assetPublishedAt?: string;
  items: ReviewItem[];
};

const emptyStatus: StatusFile = { createdAt: '', seriesTitle: 'Rico gegen Berlin', panelCount: 0, counts: {}, panels: [] };
const order = ['prompt_ready', 'ready_to_send', 'waiting_history', 'ready_for_review_manifest', 'pending_review', 'fix_needed', 'fix_job_queued', 'fix_ready_to_send', 'fix_waiting_history', 'fix_ready_to_merge', 'fix_merged_pending_review', 'approved', 'rejected'];

const tone: Record<string, { border: string; bg: string; text: string }> = {
  approved: { border: '#16a34a', bg: '#102417', text: '#86efac' },
  rejected: { border: '#111827', bg: '#07080b', text: '#9ca3af' },
  pending_review: { border: '#f59e0b', bg: '#2b210f', text: '#fcd34d' },
  fix_needed: { border: '#dc2626', bg: '#2a1010', text: '#fca5a5' },
  fix_job_queued: { border: '#9333ea', bg: '#20112e', text: '#d8b4fe' },
  fix_ready_to_send: { border: '#7c3aed', bg: '#1f1534', text: '#c4b5fd' },
  fix_waiting_history: { border: '#a855f7', bg: '#221337', text: '#e9d5ff' },
  fix_ready_to_merge: { border: '#8b5cf6', bg: '#221a38', text: '#ddd6fe' },
  fix_merged_pending_review: { border: '#f97316', bg: '#2b180c', text: '#fed7aa' },
  waiting_history: { border: '#ca8a04', bg: '#2a2110', text: '#fde68a' },
  ready_to_send: { border: '#2563eb', bg: '#111b31', text: '#93c5fd' },
  ready_for_review_manifest: { border: '#d97706', bg: '#2a1b0f', text: '#fdba74' },
  prompt_ready: { border: '#3f4550', bg: '#171b22', text: '#aab2c0' }
};

const styles: Record<string, CSSProperties> = {
  shell: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', gap: '1rem', alignItems: 'start' },
  board: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '0.75rem' },
  card: { borderRadius: 16, padding: '0.8rem', textAlign: 'left', color: 'inherit', cursor: 'pointer' },
  thumb: { height: 105, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, display: 'grid', placeItems: 'center', margin: '0.75rem 0', overflow: 'hidden', background: 'rgba(255,255,255,0.035)' },
  inspector: { position: 'sticky', top: '1rem' },
  row: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' },
  muted: { color: 'rgba(255,255,255,0.58)', fontSize: '0.78rem' },
  code: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
};

function label(state: string) {
  return state.replace(/_/g, ' ');
}

function stateTone(state: string) {
  return tone[state] ?? tone.prompt_ready;
}

function groupByScene(panels: Panel[]) {
  return panels.reduce<Record<string, Panel[]>>((acc, panel) => {
    const key = `${panel.sceneId ?? 'unknown'} · ${panel.sceneTitle ?? 'Unsorted'}`;
    acc[key] = [...(acc[key] ?? []), panel];
    return acc;
  }, {});
}

function commandFor(panel: Panel | null) {
  if (!panel) return 'node scripts/createPilotProductionStatus.mjs\nnode scripts/publishPilotStatusForUi.mjs';
  if (panel.state === 'pending_review' || panel.state === 'fix_merged_pending_review') return `node scripts/setPilotReviewDecision.mjs ${panel.panelId} approved\nnode scripts/setPilotReviewDecision.mjs ${panel.panelId} needs_fix "short review note"`;
  if (panel.state.startsWith('fix')) return 'node scripts/createPilotFixJobs.mjs\nnode scripts/createPilotFixRenderQueue.mjs\nnode scripts/createPilotFixComfyBatch.mjs';
  return 'node scripts/createPilotProductionStatus.mjs\nnode scripts/publishPilotStatusForUi.mjs\nnode scripts/publishPilotReviewForUi.mjs\nnode scripts/publishPilotReviewAssetsForUi.mjs';
}

function Badge({ state }: { state: string }) {
  const current = stateTone(state);
  return <span style={{ border: `1px solid ${current.border}`, background: current.bg, color: current.text, borderRadius: 999, padding: '0.18rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>{label(state)}</span>;
}

function PanelTile({ panel, imageUrl, assetCount, active, onSelect }: { panel: Panel; imageUrl?: string | null; assetCount: number; active: boolean; onSelect: () => void }) {
  const current = stateTone(panel.state);
  return (
    <button type="button" onClick={onSelect} style={{ ...styles.card, border: `1px solid ${active ? current.text : current.border}`, background: active ? 'rgba(255,255,255,0.07)' : current.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
        <strong>{panel.panelId.replace('panel_', 'P')}</strong>
        <Badge state={panel.state} />
      </div>
      <div style={styles.thumb}>{imageUrl ? <img src={imageUrl} alt={panel.panelId} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'NO IMAGE'}</div>
      <p style={styles.muted}>{panel.shotType ?? 'shot n/a'} · {assetCount} assets</p>
      <p style={styles.muted}>{panel.nextAction}</p>
    </button>
  );
}

export function StudioControlRoomV2() {
  const [status, setStatus] = useState<StatusFile>(emptyStatus);
  const [review, setReview] = useState<ReviewIndex>({ createdAt: '', items: [] });
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/status/pilot-production-status.json', { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject(new Error(`status HTTP ${response.status}`))),
      fetch('/review/pilot/index.json', { cache: 'no-store' }).then((response) => response.ok ? response.json() : { createdAt: '', items: [] })
    ]).then(([statusData, reviewData]: [StatusFile, ReviewIndex]) => {
      if (cancelled) return;
      setStatus(statusData);
      setReview(reviewData);
      setSelectedPanelId(statusData.panels[0]?.panelId ?? null);
    }).catch((loadError) => {
      if (!cancelled) setError(String(loadError));
    });
    return () => { cancelled = true; };
  }, []);

  const reviewByPanel = useMemo(() => new Map(review.items.map((item) => [item.panelId, item])), [review.items]);
  const visiblePanels = useMemo(() => stateFilter === 'all' ? status.panels : status.panels.filter((panel) => panel.state === stateFilter), [stateFilter, status.panels]);
  const scenes = useMemo(() => groupByScene(visiblePanels), [visiblePanels]);
  const selectedPanel = status.panels.find((panel) => panel.panelId === selectedPanelId) ?? status.panels[0] ?? null;
  const selectedReview = selectedPanel ? reviewByPanel.get(selectedPanel.panelId) : null;
  const command = commandFor(selectedPanel);
  const assetTotal = review.items.reduce((sum, item) => sum + (item.publicAssetCount ?? 0), 0);

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Studio Control Room</p>
          <h2>{status.seriesTitle} · Thumbnail Production Board</h2>
          <p className="body-copy">Production states, review thumbnails, fix loop status and next actions in one control surface.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload Status</button>
      </div>

      {error && <div className="hero-card warning-card"><p className="eyebrow">Status missing</p><h3>Publish status and review assets first.</h3><div className="prompt-box" style={styles.code}>node scripts/createPilotProductionStatus.mjs{`\n`}node scripts/publishPilotStatusForUi.mjs{`\n`}node scripts/publishPilotReviewForUi.mjs{`\n`}node scripts/publishPilotReviewAssetsForUi.mjs</div><p style={styles.muted}>{error}</p></div>}

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Total Panels</p><strong>{status.panelCount}</strong><span>tracked</span></div></div>
        <div className="stat-card"><div><p>Published Assets</p><strong>{assetTotal}</strong><span>thumbnails</span></div></div>
        {(order.filter((state) => status.counts[state]).slice(0, 6)).map((state) => <div className="stat-card" key={state}><div><p>{label(state)}</p><strong>{status.counts[state]}</strong><span>{state}</span></div></div>)}
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Filters</p><h3>Production states</h3></div><span style={styles.muted}>Status: {status.createdAt || 'not published'} · Assets: {review.assetPublishedAt ?? 'not published'}</span></div>
        <div style={styles.row}>
          <button className={stateFilter === 'all' ? 'primary-button' : 'ghost-button'} type="button" onClick={() => setStateFilter('all')}>All</button>
          {order.map((state) => <button key={state} className={stateFilter === state ? 'primary-button' : 'ghost-button'} type="button" onClick={() => setStateFilter(state)} disabled={!status.counts[state]} style={{ opacity: status.counts[state] ? 1 : 0.38 }}>{label(state)} · {status.counts[state] ?? 0}</button>)}
        </div>
      </article>

      <div style={styles.shell}>
        <main className="page-stack">
          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Panel Board</p><h3>Storyboard strip with thumbnails</h3></div><span style={styles.muted}>{visiblePanels.length} visible panels</span></div>
            {Object.entries(scenes).map(([scene, panels]) => <div key={scene}><div className="card-header"><div><p className="eyebrow">Scene</p><h3>{scene}</h3></div><span style={styles.muted}>{panels.length}</span></div><div style={styles.board}>{panels.map((panel) => { const asset = reviewByPanel.get(panel.panelId); return <PanelTile key={panel.panelId} panel={panel} imageUrl={asset?.primaryImagePublicUrl} assetCount={asset?.publicAssetCount ?? 0} active={panel.panelId === selectedPanel?.panelId} onSelect={() => setSelectedPanelId(panel.panelId)} />; })}</div></div>)}
          </article>
        </main>

        <aside className="page-stack" style={styles.inspector}>
          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Inspector</p><h3>{selectedPanel?.panelId ?? 'No panel selected'}</h3></div>{selectedPanel && <Badge state={selectedPanel.state} />}</div>
            {selectedPanel ? <div className="page-stack">
              <div style={styles.thumb}>{selectedReview?.primaryImagePublicUrl ? <img src={selectedReview.primaryImagePublicUrl} alt={selectedPanel.panelId} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'NO IMAGE'}</div>
              <div className="dialogue-box"><p className="eyebrow">Next Action</p><p>{selectedPanel.nextAction}</p></div>
              <div className="prompt-box"><p className="eyebrow">Scene</p><p>{selectedPanel.sceneTitle ?? 'n/a'}</p><p style={styles.muted}>{selectedPanel.shotType ?? 'shot n/a'}</p></div>
              <div className="prompt-box"><p className="eyebrow">Dialogue</p><p>{selectedPanel.dialogue || 'No dialogue attached.'}</p></div>
              <div className="prompt-box"><p className="eyebrow">Review Asset</p><p>{selectedReview?.primaryImagePublicUrl ?? selectedPanel.review.primaryImage ?? 'n/a'}</p><p style={styles.muted}>{selectedReview?.publicAssetCount ?? 0} published assets</p></div>
              <div className="prompt-box"><p className="eyebrow">Fix Loop</p><p>Jobs: {selectedPanel.fix.jobCount}</p><p>Latest: {selectedPanel.fix.latestJobId ?? 'n/a'}</p><p>Attempt: {selectedPanel.fix.attempt ?? 'n/a'}</p></div>
            </div> : <p className="body-copy">No panel selected.</p>}
          </article>

          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Command Dock</p><h3>Copy-only commands</h3></div></div>
            <div className="prompt-box" style={styles.code}>{command}</div>
            <button className="primary-button" type="button" onClick={() => { navigator.clipboard?.writeText(command); setCopied(true); }}>{copied ? 'Copied' : 'Copy Commands'}</button>
          </article>
        </aside>
      </div>
    </section>
  );
}
