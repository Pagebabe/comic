import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type PublishedAsset = {
  panelId: string;
  sourcePath: string;
  publicUrl: string;
};

type MissingAsset = {
  panelId?: string;
  imageId?: string | null;
  filename?: string | null;
  estimatedPath?: string | null;
  reason: string;
  publicManifest?: string;
};

type AssetIndex = {
  id: string;
  createdAt: string;
  sourceReviewIndex: string;
  publishedCount: number;
  missingCount: number;
  published: PublishedAsset[];
  missing: MissingAsset[];
};

const emptyIndex: AssetIndex = {
  id: 'missing_asset_index',
  createdAt: '',
  sourceReviewIndex: '/review/pilot/index.json',
  publishedCount: 0,
  missingCount: 0,
  published: [],
  missing: []
};

const styles: Record<string, CSSProperties> = {
  shell: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '1rem', alignItems: 'start' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.85rem' },
  tile: { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, background: 'rgba(255,255,255,0.03)', color: 'inherit', padding: '0.75rem', textAlign: 'left', cursor: 'pointer' },
  activeTile: { border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)' },
  thumb: { height: 160, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, display: 'grid', placeItems: 'center', overflow: 'hidden', background: 'rgba(255,255,255,0.035)', marginBottom: '0.7rem' },
  preview: { maxWidth: '100%', maxHeight: 520, objectFit: 'contain', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)' },
  inspector: { position: 'sticky', top: '1rem' },
  code: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  muted: { color: 'rgba(255,255,255,0.58)', fontSize: '0.78rem' },
  filterRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }
};

function isFixAsset(asset: PublishedAsset) {
  const text = `${asset.sourcePath} ${asset.publicUrl}`.toLowerCase();
  return text.includes('/fix') || text.includes('fix_') || text.includes('attempt_2') || text.includes('attempt-2');
}

function assetKind(asset: PublishedAsset) {
  return isFixAsset(asset) ? 'fix' : 'render';
}

function fileName(value: string) {
  return value.split('/').pop() ?? value;
}

function uniquePanels(assets: PublishedAsset[], missing: MissingAsset[]) {
  const ids = [...assets.map((asset) => asset.panelId), ...missing.map((item) => item.panelId).filter(Boolean) as string[]];
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function AssetTile({ asset, active, onSelect }: { asset: PublishedAsset; active: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} style={{ ...styles.tile, ...(active ? styles.activeTile : {}) }}>
      <div style={styles.thumb}>
        <img src={asset.publicUrl} alt={`${asset.panelId} asset`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
        <strong>{asset.panelId}</strong>
        <span className="topbar-pill">{assetKind(asset)}</span>
      </div>
      <p style={styles.muted}>{fileName(asset.publicUrl)}</p>
    </button>
  );
}

export function AssetGalleryRoom() {
  const [index, setIndex] = useState<AssetIndex>(emptyIndex);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [panelFilter, setPanelFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/assets/review/pilot/index.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: AssetIndex) => {
        if (cancelled) return;
        setIndex(data);
        setSelectedUrl(data.published[0]?.publicUrl ?? null);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(String(error));
      });
    return () => { cancelled = true; };
  }, []);

  const panels = useMemo(() => uniquePanels(index.published, index.missing), [index.missing, index.published]);
  const visibleAssets = useMemo(() => index.published.filter((asset) => {
    if (panelFilter !== 'all' && asset.panelId !== panelFilter) return false;
    if (kindFilter !== 'all' && assetKind(asset) !== kindFilter) return false;
    return true;
  }), [index.published, kindFilter, panelFilter]);
  const visibleMissing = useMemo(() => index.missing.filter((item) => panelFilter === 'all' || item.panelId === panelFilter), [index.missing, panelFilter]);
  const selectedAsset = index.published.find((asset) => asset.publicUrl === selectedUrl) ?? visibleAssets[0] ?? null;
  const fixCount = index.published.filter(isFixAsset).length;
  const renderCount = index.published.length - fixCount;
  const copyValue = selectedAsset?.publicUrl ?? '/assets/review/pilot/index.json';

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Asset Gallery</p>
          <h2>Published panel images and fix attempts</h2>
          <p className="body-copy">Production asset browser for images copied into public/assets/review/pilot.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload Assets</button>
      </div>

      {loadError && (
        <div className="hero-card warning-card">
          <p className="eyebrow">Asset index missing</p>
          <h3>Publish review assets before opening the gallery.</h3>
          <div className="prompt-box" style={styles.code}>node scripts/createPilotReviewManifests.mjs{`\n`}node scripts/publishPilotReviewForUi.mjs{`\n`}node scripts/publishPilotReviewAssetsForUi.mjs</div>
          <p style={styles.muted}>{loadError}</p>
        </div>
      )}

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Published</p><strong>{index.publishedCount}</strong><span>image previews</span></div></div>
        <div className="stat-card"><div><p>Missing</p><strong>{index.missingCount}</strong><span>not found on disk</span></div></div>
        <div className="stat-card"><div><p>Render</p><strong>{renderCount}</strong><span>first-pass images</span></div></div>
        <div className="stat-card"><div><p>Fix</p><strong>{fixCount}</strong><span>fix candidates</span></div></div>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Filters</p><h3>Browse assets</h3></div><span style={styles.muted}>Published: {index.createdAt || 'not published'}</span></div>
        <div style={styles.filterRow}>
          <button className={panelFilter === 'all' ? 'primary-button' : 'ghost-button'} type="button" onClick={() => setPanelFilter('all')}>All panels</button>
          {panels.map((panel) => <button key={panel} className={panelFilter === panel ? 'primary-button' : 'ghost-button'} type="button" onClick={() => setPanelFilter(panel)}>{panel}</button>)}
        </div>
        <div style={{ ...styles.filterRow, marginTop: '0.75rem' }}>
          {['all', 'render', 'fix'].map((kind) => <button key={kind} className={kindFilter === kind ? 'primary-button' : 'ghost-button'} type="button" onClick={() => setKindFilter(kind)}>{kind}</button>)}
        </div>
      </article>

      <div style={styles.shell}>
        <main className="page-stack">
          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Gallery</p><h3>{visibleAssets.length} visible assets</h3></div></div>
            <div style={styles.grid}>
              {visibleAssets.map((asset) => <AssetTile key={asset.publicUrl} asset={asset} active={asset.publicUrl === selectedAsset?.publicUrl} onSelect={() => setSelectedUrl(asset.publicUrl)} />)}
              {visibleAssets.length === 0 && <p className="body-copy">No assets match this filter.</p>}
            </div>
          </article>

          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Missing Assets</p><h3>{visibleMissing.length} unresolved image references</h3></div></div>
            <div className="page-stack">
              {visibleMissing.slice(0, 20).map((item, indexNumber) => (
                <div className="prompt-box" key={`${item.panelId}-${item.reason}-${indexNumber}`}>
                  <p className="eyebrow">{item.panelId ?? 'unknown panel'} · {item.reason}</p>
                  <p>{item.estimatedPath ?? item.filename ?? item.publicManifest ?? 'no path'}</p>
                </div>
              ))}
              {visibleMissing.length === 0 && <p className="body-copy">No missing assets for this filter.</p>}
            </div>
          </article>
        </main>

        <aside className="page-stack" style={styles.inspector}>
          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Inspector</p><h3>{selectedAsset?.panelId ?? 'No asset selected'}</h3></div></div>
            {selectedAsset ? (
              <div className="page-stack">
                <div style={{ display: 'grid', placeItems: 'center' }}><img src={selectedAsset.publicUrl} alt={`${selectedAsset.panelId} selected asset`} style={styles.preview} /></div>
                <div className="prompt-box"><p className="eyebrow">Public URL</p><p>{selectedAsset.publicUrl}</p></div>
                <div className="prompt-box"><p className="eyebrow">Source</p><p>{selectedAsset.sourcePath}</p></div>
                <div className="prompt-box"><p className="eyebrow">Kind</p><p>{assetKind(selectedAsset)}</p></div>
              </div>
            ) : <p className="body-copy">No selected asset.</p>}
          </article>

          <article className="card">
            <div className="card-header"><div><p className="eyebrow">Copy URL</p><h3>Selected asset</h3></div></div>
            <div className="prompt-box" style={styles.code}>{copyValue}</div>
            <button className="primary-button" type="button" onClick={() => { navigator.clipboard?.writeText(copyValue); setCopied(true); }}>{copied ? 'Copied' : 'Copy URL'}</button>
          </article>
        </aside>
      </div>
    </section>
  );
}
