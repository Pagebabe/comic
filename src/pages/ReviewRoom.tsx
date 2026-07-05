import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type PublicReviewIndexItem = {
  panelId: string;
  status: string;
  decision: string | null;
  primaryImage: string | null;
  primaryImagePublicUrl?: string | null;
  imageCount: number;
  checkCount: number;
  publicAssetCount?: number;
  latestFixJobId: string | null;
  publicManifest: string;
};

type PublicReviewIndex = {
  id: string;
  createdAt: string;
  itemCount: number;
  skippedCount: number;
  assetPublishedAt?: string;
  items: PublicReviewIndexItem[];
};

type ReviewImage = {
  id?: string;
  filename?: string | null;
  estimatedPath?: string | null;
  sourcePath?: string | null;
  publicUrl?: string | null;
  source?: string | null;
  sourceFixJobId?: string | null;
  promptId?: string | null;
  attempt?: number | null;
  reviewNote?: string | null;
};

type ReviewCheck = {
  id: string;
  label: string;
  status?: string;
  notes?: string;
};

type ReviewManifest = {
  id: string;
  panelId: string;
  status: string;
  decision: string | null;
  images: ReviewImage[];
  primaryImage: string | null;
  primaryImagePublicUrl?: string | null;
  checks: ReviewCheck[];
  allowedDecisions?: string[];
  nextAction?: string;
  latestFix?: Record<string, unknown> | null;
};

const emptyIndex: PublicReviewIndex = {
  id: 'missing_review_index',
  createdAt: '',
  itemCount: 0,
  skippedCount: 0,
  items: []
};

const styles: Record<string, CSSProperties> = {
  reviewShell: { display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr) 360px', gap: '1rem', alignItems: 'start' },
  listPanel: { maxHeight: 'calc(100vh - 220px)', overflow: 'auto', display: 'grid', gap: '0.55rem' },
  viewer: { minHeight: 460, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, background: 'rgba(255,255,255,0.035)', display: 'grid', placeItems: 'center', padding: '1rem', textAlign: 'center' },
  image: { maxWidth: '100%', maxHeight: 620, objectFit: 'contain', borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)' },
  inspector: { position: 'sticky', top: '1rem' },
  command: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  smallMuted: { color: 'rgba(255,255,255,0.58)', fontSize: '0.78rem' },
  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.65rem' },
  checkRow: { display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.6rem', alignItems: 'start' },
  thumb: { height: 110, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, display: 'grid', placeItems: 'center', overflow: 'hidden', background: 'rgba(255,255,255,0.035)' }
};

function statusTone(status: string) {
  if (status === 'approved') return { border: '#16a34a', background: '#102417', text: '#86efac' };
  if (status === 'rejected') return { border: '#111827', background: '#07080b', text: '#9ca3af' };
  if (status === 'needs_fix' || status === 'retry_requested') return { border: '#dc2626', background: '#2a1010', text: '#fca5a5' };
  if (status === 'pending_review') return { border: '#f59e0b', background: '#2b210f', text: '#fcd34d' };
  return { border: '#3f4550', background: '#171b22', text: '#aab2c0' };
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return <span style={{ border: `1px solid ${tone.border}`, background: tone.background, color: tone.text, borderRadius: 999, padding: '0.18rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>{status}</span>;
}

function commandFor(panelId: string, decision: string) {
  if (decision === 'approved') return `node scripts/setPilotReviewDecision.mjs ${panelId} approved`;
  if (decision === 'needs_fix') return `node scripts/setPilotReviewDecision.mjs ${panelId} needs_fix "describe the issue"`;
  if (decision === 'retry') return `node scripts/setPilotReviewDecision.mjs ${panelId} retry "fresh attempt"`;
  return `node scripts/setPilotReviewDecision.mjs ${panelId} rejected "do not use"`;
}

function CommandButton({ command, label }: { command: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="ghost-button" type="button" onClick={() => { navigator.clipboard?.writeText(command); setCopied(true); }}>{copied ? 'Copied' : label}</button>;
}

function imageLabel(image: ReviewImage) {
  return image.publicUrl ?? image.estimatedPath ?? image.sourcePath ?? image.filename ?? image.id ?? 'image candidate';
}

export function ReviewRoom() {
  const [index, setIndex] = useState<PublicReviewIndex>(emptyIndex);
  const [manifests, setManifests] = useState<Record<string, ReviewManifest>>({});
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/review/pilot/index.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(async (data: PublicReviewIndex) => {
        if (cancelled) return;
        setIndex(data);
        setSelectedPanelId(data.items[0]?.panelId ?? null);
        setSelectedImageUrl(data.items[0]?.primaryImagePublicUrl ?? null);
        const entries = await Promise.all(data.items.map(async (item) => {
          const response = await fetch(item.publicManifest, { cache: 'no-store' });
          if (!response.ok) throw new Error(`Manifest ${item.panelId} HTTP ${response.status}`);
          const manifest = await response.json();
          return [item.panelId, manifest] as const;
        }));
        if (!cancelled) setManifests(Object.fromEntries(entries));
      })
      .catch((error) => {
        if (!cancelled) setLoadError(String(error));
      });

    return () => { cancelled = true; };
  }, []);

  const visibleItems = useMemo(() => {
    if (filter === 'all') return index.items;
    return index.items.filter((item) => (manifests[item.panelId]?.status ?? item.status) === filter || (manifests[item.panelId]?.decision ?? item.decision) === filter);
  }, [filter, index.items, manifests]);

  const selectedManifest = selectedPanelId ? manifests[selectedPanelId] : null;
  const selectedIndexItem = selectedPanelId ? index.items.find((item) => item.panelId === selectedPanelId) : null;
  const currentImageUrl = selectedImageUrl ?? selectedManifest?.primaryImagePublicUrl ?? selectedIndexItem?.primaryImagePublicUrl ?? null;
  const counts = useMemo(() => index.items.reduce<Record<string, number>>((acc, item) => {
    const manifest = manifests[item.panelId];
    const key = manifest?.decision ?? manifest?.status ?? item.decision ?? item.status ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {}), [index.items, manifests]);
  const allowedDecisions = selectedManifest?.allowedDecisions ?? ['approved', 'needs_fix', 'retry', 'rejected'];

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Review Room</p>
          <h2>Dailies · Image review and fix decisions</h2>
          <p className="body-copy">Manifest-based review screen with published image previews. Commands are copy-only.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload Review Data</button>
      </div>

      {loadError && (
        <div className="hero-card warning-card">
          <p className="eyebrow">Review data missing</p>
          <h3>Publish review manifests and assets before opening the Review Room.</h3>
          <div className="prompt-box" style={styles.command}>node scripts/createPilotReviewManifests.mjs{`\n`}node scripts/publishPilotReviewForUi.mjs{`\n`}node scripts/publishPilotReviewAssetsForUi.mjs</div>
          <p style={styles.smallMuted}>{loadError}</p>
        </div>
      )}

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Review Items</p><strong>{index.itemCount}</strong><span>{index.skippedCount} skipped</span></div></div>
        <div className="stat-card"><div><p>Pending</p><strong>{counts.pending_review ?? 0}</strong><span>awaiting decision</span></div></div>
        <div className="stat-card"><div><p>Approved</p><strong>{counts.approved ?? 0}</strong><span>ready for assembly</span></div></div>
        <div className="stat-card"><div><p>Assets</p><strong>{index.items.reduce((sum, item) => sum + (item.publicAssetCount ?? 0), 0)}</strong><span>published previews</span></div></div>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Filters</p><h3>Review states</h3></div><span style={styles.smallMuted}>Assets: {index.assetPublishedAt ?? 'not published'}</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['all', 'pending_review', 'approved', 'needs_fix', 'retry', 'rejected'].map((item) => <button key={item} className={filter === item ? 'primary-button' : 'ghost-button'} type="button" onClick={() => setFilter(item)}>{item} {item !== 'all' ? `· ${counts[item] ?? 0}` : ''}</button>)}
        </div>
      </article>

      <div style={styles.reviewShell}>
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Queue</p><h3>Panels</h3></div><span style={styles.smallMuted}>{visibleItems.length}</span></div>
          <div style={styles.listPanel}>
            {visibleItems.map((item) => {
              const manifest = manifests[item.panelId];
              const status = manifest?.decision ?? manifest?.status ?? item.decision ?? item.status;
              const active = item.panelId === selectedPanelId;
              return (
                <button key={item.panelId} type="button" onClick={() => { setSelectedPanelId(item.panelId); setSelectedImageUrl(manifest?.primaryImagePublicUrl ?? item.primaryImagePublicUrl ?? null); }} style={{ textAlign: 'left', border: active ? '1px solid rgba(255,255,255,0.48)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 14, background: active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)', color: 'inherit', padding: '0.75rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}><strong>{item.panelId}</strong><StatusBadge status={status ?? 'unknown'} /></div>
                  <p style={styles.smallMuted}>{item.imageCount} images · {item.publicAssetCount ?? 0} previews</p>
                  {item.latestFixJobId && <p style={styles.smallMuted}>fix: {item.latestFixJobId}</p>}
                </button>
              );
            })}
          </div>
        </article>

        <main className="page-stack">
          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Current Panel</p><h3>{selectedManifest?.panelId ?? selectedIndexItem?.panelId ?? 'No panel selected'}</h3></div>{selectedManifest && <StatusBadge status={selectedManifest.decision ?? selectedManifest.status} />}</div>
            <div style={styles.viewer}>
              {currentImageUrl ? <img src={currentImageUrl} alt={selectedManifest?.panelId ?? 'review image'} style={styles.image} /> : <div><p className="eyebrow">Primary Image</p><h3>{selectedManifest?.primaryImage ?? selectedIndexItem?.primaryImage ?? 'No published image yet'}</h3><p style={styles.smallMuted}>Run publishPilotReviewAssetsForUi after renders exist.</p></div>}
            </div>
          </article>

          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Candidates</p><h3>Image versions</h3></div></div>
            <div style={styles.imageGrid}>
              {(selectedManifest?.images ?? []).map((image, indexNumber) => (
                <button key={image.id ?? `${imageLabel(image)}-${indexNumber}`} type="button" onClick={() => setSelectedImageUrl(image.publicUrl ?? null)} style={{ textAlign: 'left', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, background: 'rgba(255,255,255,0.03)', color: 'inherit', padding: '0.65rem', cursor: image.publicUrl ? 'pointer' : 'default' }}>
                  <div style={styles.thumb}>{image.publicUrl ? <img src={image.publicUrl} alt={imageLabel(image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'NO PREVIEW'}</div>
                  <p className="eyebrow">Candidate {indexNumber + 1}</p>
                  <p style={styles.smallMuted}>{imageLabel(image)}</p>
                  <p style={styles.smallMuted}>attempt {image.attempt ?? 'n/a'} · {image.source ?? 'render'}</p>
                </button>
              ))}
              {selectedManifest && selectedManifest.images.length === 0 && <p className="body-copy">No image candidates in manifest.</p>}
            </div>
          </article>
        </main>

        <aside className="page-stack" style={styles.inspector}>
          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Checklist</p><h3>Approval gates</h3></div></div>
            <div className="page-stack">
              {(selectedManifest?.checks ?? []).map((check) => <div className="prompt-box" key={check.id} style={styles.checkRow}><span>{check.status === 'passed' ? '✓' : '□'}</span><div><strong>{check.label ?? check.id}</strong>{check.notes && <p style={styles.smallMuted}>{check.notes}</p>}</div><StatusBadge status={check.status ?? 'unchecked'} /></div>)}
              {selectedManifest && selectedManifest.checks.length === 0 && <p className="body-copy">No checks in manifest.</p>}
            </div>
          </article>

          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Decision Dock</p><h3>Copy-only commands</h3></div></div>
            {selectedManifest ? <div className="page-stack">{allowedDecisions.map((decision) => <div className="prompt-box" key={decision} style={styles.command}><p>{commandFor(selectedManifest.panelId, decision)}</p><CommandButton command={commandFor(selectedManifest.panelId, decision)} label={`Copy ${decision}`} /></div>)}<div className="dialogue-box"><p className="eyebrow">Refresh after decision</p><p>Run status + review publishers again to refresh the UI.</p></div></div> : <p className="body-copy">Select a panel to get review commands.</p>}
          </article>
        </aside>
      </div>
    </section>
  );
}
