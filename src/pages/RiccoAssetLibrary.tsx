import { useEffect, useMemo, useState } from 'react';
import { riccoPanels } from '../data/riccoStudio';
import {
  buildAssetLibraryItems,
  buildAssetLibraryReport,
  DEFAULT_ASSET_LIBRARY_FILTERS,
  filterAssetLibraryItems,
  summarizeAssetLibrary,
  type AssetLibraryFilters
} from '../domain/assets/riccoAssetLibrary';
import {
  RICCO_IMAGES_STORAGE_KEY,
  readLocalGenerationJobs
} from '../lib/backend/localProductionStore';
import type { GenerationJob } from '../types/productionBackend';
import type { RiccoPanelImage } from '../types/riccoReview';

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(RICCO_IMAGES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
}

export function RiccoAssetLibrary() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [filters, setFilters] = useState<AssetLibraryFilters>(DEFAULT_ASSET_LIBRARY_FILTERS);
  const [status, setStatus] = useState('');

  function refresh() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setStatus('Asset Library neu geladen');
    window.setTimeout(() => setStatus(''), 1500);
  }

  useEffect(() => {
    refresh();
  }, []);

  const items = useMemo(() => buildAssetLibraryItems(images, generationJobs), [images, generationJobs]);
  const filteredItems = useMemo(() => filterAssetLibraryItems(items, filters), [items, filters]);
  const summary = useMemo(() => summarizeAssetLibrary(items), [items]);
  const visibleSummary = useMemo(() => summarizeAssetLibrary(filteredItems), [filteredItems]);

  function updateFilters(patch: Partial<AssetLibraryFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  async function copyReport() {
    await navigator.clipboard.writeText(buildAssetLibraryReport(filteredItems));
    setStatus('Asset Report kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className="hero-card">
        <p className="eyebrow">Ricco Asset Library v0.1</p>
        <h2>Alle Panel-Bilder an einem Ort</h2>
        <p className="body-copy">
          Durchsuche alle importierten und gespeicherten Bildvarianten. Filtere nach Panel, Final/Variant, Job-Link, Quelle und Textsuche.
        </p>
        <div className="chips">
          <span>{summary.total} Assets</span>
          <span>{summary.finals} Finals</span>
          <span>{summary.variants} Varianten</span>
          <span>{summary.linkedToJobs} Job-links</span>
          <span>{summary.localImages} lokale Bilder</span>
          <span>{visibleSummary.total} sichtbar</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={refresh}>Neu laden</button>
          <button className="ghost-button" onClick={copyReport}>Report kopieren</button>
          <button className="ghost-button" onClick={() => setFilters(DEFAULT_ASSET_LIBRARY_FILTERS)}>Filter reset</button>
          <a className="ghost-link" href="#/ricco-asset-import">Asset Import</a>
          <a className="ghost-link" href="#/ricco-image-review">Image Review</a>
          <a className="ghost-link" href="#/ricco-storage">Storage</a>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Filter</p>
            <h3>Asset-Auswahl</h3>
          </div>
          <span className="status-badge status-active">{visibleSummary.total}/{summary.total}</span>
        </div>

        <div className="grid four-col">
          <div>
            <label>Panel</label>
            <select value={filters.panelId} onChange={(event) => updateFilters({ panelId: event.target.value })}>
              <option value="all">alle Panels</option>
              {riccoPanels.map((panel) => <option key={panel.id} value={panel.id}>Panel {panel.panelNumber}: {panel.title}</option>)}
            </select>
          </div>
          <div>
            <label>Final/Variant</label>
            <select value={filters.finalFilter} onChange={(event) => updateFilters({ finalFilter: event.target.value as AssetLibraryFilters['finalFilter'] })}>
              <option value="all">alles</option>
              <option value="final">nur Finals</option>
              <option value="variant">nur Varianten</option>
            </select>
          </div>
          <div>
            <label>Job-Link</label>
            <select value={filters.jobFilter} onChange={(event) => updateFilters({ jobFilter: event.target.value as AssetLibraryFilters['jobFilter'] })}>
              <option value="all">alles</option>
              <option value="linked">mit Job-Link</option>
              <option value="unlinked">ohne Job-Link</option>
            </select>
          </div>
          <div>
            <label>Quelle</label>
            <select value={filters.source} onChange={(event) => updateFilters({ source: event.target.value })}>
              <option value="all">alle Quellen</option>
              {summary.sources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
          </div>
        </div>

        <label>Suche</label>
        <input value={filters.query} onChange={(event) => updateFilters({ query: event.target.value })} placeholder="id, notes, source, prompt, job status..." />
      </section>

      {filteredItems.length === 0 && (
        <div className="hero-card warning-card">
          <p className="eyebrow">Leer</p>
          <h2>Keine Assets gefunden</h2>
          <p className="body-copy">Importiere zuerst Bilder oder passe die Filter an.</p>
        </div>
      )}

      <div className="grid two-col">
        {filteredItems.map((item) => (
          <article className="card export-card" key={item.image.id} style={item.isFinal ? { borderColor: 'rgba(120,255,170,0.36)' } : undefined}>
            <div className="mock-preview image-preview" style={{ backgroundImage: `url(${item.image.imageUrl})` }}>
              <span>Panel {item.panelNumber}</span>
              <strong>{item.isFinal ? 'FINAL' : 'VARIANT'}</strong>
            </div>

            <div className="card-header">
              <div>
                <p className="eyebrow">{item.image.id}</p>
                <h3>{item.panelTitle}</h3>
              </div>
              <span className={`status-badge ${item.isFinal ? 'status-active' : ''}`}>{item.isFinal ? 'final' : 'variant'}</span>
            </div>

            <div className="chips">
              <span>{item.image.source}</span>
              <span>{item.isLocal ? 'local data-url' : 'url/public'}</span>
              <span>Rating {item.image.rating || '—'}</span>
              <span>Continuity {item.image.continuityScore || '—'}</span>
              <span>{item.generationJob ? 'job linked' : 'no job'}</span>
            </div>

            {item.generationJob && (
              <div className="dialogue-box">
                <p className="eyebrow">Generation Job</p>
                <p>{item.generationJob.id}</p>
                <p>Status: {item.generationJob.status}</p>
                <p>Workflow: {item.generationJob.workflowId} {item.generationJob.workflowVersion}</p>
              </div>
            )}

            {item.image.notes && (
              <div className="dialogue-box">
                <p className="eyebrow">Review Notes</p>
                <p>{item.image.notes}</p>
              </div>
            )}

            <div className="review-actions">
              <a className="ghost-link" href={`#/ricco-image-review`}>Review öffnen</a>
              <a className="ghost-link" href={`#/ricco-export`}>Export Gate</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
