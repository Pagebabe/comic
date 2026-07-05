import { useMemo, useState } from 'react';
import { riccoPanels } from '../data/riccoStudio';
import {
  buildAssetImportRows,
  buildRiccoImagesFromAssetRows,
  importedGenerationJobIds,
  relinkAssetImportRow,
  RICCO_ASSET_IMPORT_EXAMPLE_INPUT,
  type AssetImportRow
} from '../domain/assets/riccoAssetImport';
import {
  RICCO_IMAGES_STORAGE_KEY,
  readLocalGenerationJobs,
  updateLocalGenerationJobStatus
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

function buildRows(
  rawInput: string,
  fallbackPanelId: string,
  generationJobs: GenerationJob[],
  selectedJob?: GenerationJob
) {
  return buildAssetImportRows({ rawInput, fallbackPanelId, generationJobs, selectedJob });
}

export function RiccoAssetImport() {
  const initialPanelId = riccoPanels[0]?.id ?? '';
  const initialJobs = readLocalGenerationJobs();
  const [fallbackPanelId, setFallbackPanelId] = useState(initialPanelId);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState('');
  const selectedGenerationJob = generationJobs.find((job) => job.id === selectedJobId);
  const [input, setInput] = useState(RICCO_ASSET_IMPORT_EXAMPLE_INPUT);
  const [rows, setRows] = useState<AssetImportRow[]>(() => buildRows(RICCO_ASSET_IMPORT_EXAMPLE_INPUT, initialPanelId, initialJobs));
  const [status, setStatus] = useState('');

  const readyRows = rows.filter((row) => row.valid);
  const blockedRows = rows.filter((row) => !row.valid);
  const jobLinkedRows = rows.filter((row) => row.generationJobId);
  const autoLinkedRows = rows.filter((row) => row.jobMatch === 'auto_panel_match');
  const selectedLinkedRows = rows.filter((row) => row.jobMatch === 'selected_job');

  const groupedByPanel = useMemo(() => {
    return riccoPanels.map((panel) => ({
      panel,
      rows: rows.filter((row) => row.panelId === panel.id)
    }));
  }, [rows]);

  function refreshGenerationJobs() {
    const nextJobs = readLocalGenerationJobs();
    const selectedJob = nextJobs.find((job) => job.id === selectedJobId);

    setGenerationJobs(nextJobs);
    setRows(buildRows(input, fallbackPanelId, nextJobs, selectedJob));
    setStatus(`${nextJobs.length} Generation Jobs geladen und Pfade neu verknüpft.`);
  }

  function parseInput(jobOverride?: GenerationJob) {
    const sourceJob = jobOverride ?? selectedGenerationJob;
    const nextRows = buildRows(input, fallbackPanelId, generationJobs, sourceJob);
    const linkedCount = nextRows.filter((row) => row.generationJobId).length;

    setRows(nextRows);
    setStatus(`${nextRows.length} Pfade gelesen. ${linkedCount} automatisch/manuell mit Jobs verknüpft.`);
  }

  function handleJobChange(jobId: string) {
    const job = generationJobs.find((item) => item.id === jobId);
    const nextFallbackPanelId = job?.panelId ?? fallbackPanelId;

    setSelectedJobId(jobId);

    if (job?.panelId) {
      setFallbackPanelId(job.panelId);
    }

    setRows(buildRows(input, nextFallbackPanelId, generationJobs, job));
  }

  function updateRowPanel(rowId: string, panelId: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;

        return relinkAssetImportRow({
          row,
          panelId,
          generationJobs,
          selectedJob: selectedGenerationJob
        });
      })
    );
  }

  function removeRow(rowId: string) {
    setRows((current) => current.filter((row) => row.id !== rowId));
  }

  function importReadyRows() {
    if (readyRows.length === 0) {
      setStatus('Keine gültigen Bildpfade zum Importieren.');
      return;
    }

    const current = readStoredImages();
    const importedJobIds = importedGenerationJobIds(readyRows);
    const nextImages = buildRiccoImagesFromAssetRows({ rows: readyRows, generationJobs });

    try {
      window.localStorage.setItem(RICCO_IMAGES_STORAGE_KEY, JSON.stringify([...nextImages, ...current]));
      importedJobIds.forEach((jobId) => updateLocalGenerationJobStatus(jobId, 'imported_as_asset', 'At least one output asset was imported.'));
      setGenerationJobs(readLocalGenerationJobs());
      setRows((currentRows) => currentRows.filter((row) => !row.valid));
      setStatus(`${nextImages.length} Public Assets ins Image Review importiert.`);
    } catch {
      setStatus('Import fehlgeschlagen. Browser-Speicher prüfen.');
    }
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Public Asset Import v0.4</p>
        <h2>Bildpfade automatisch mit Generation Jobs verknüpfen</h2>
        <p className="body-copy">
          Lege generierte Bilder in Vite unter public/generated/ ab. Die Seite erkennt das Panel aus dem Dateinamen und verknüpft automatisch den passenden Generation Job. Ein ausgewählter Job bleibt als manueller Override möglich.
        </p>
        <div className="chips">
          <span>{readyRows.length} bereit</span>
          <span>{blockedRows.length} blockiert</span>
          <span>{jobLinkedRows.length} job-linked</span>
          <span>{autoLinkedRows.length} auto-linked</span>
          <span>{selectedLinkedRows.length} selected-linked</span>
          <span>{generationJobs.length} Generation Jobs</span>
          <span>source: public_asset</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={importReadyRows}>Bereite Pfade importieren</button>
          <button className="ghost-button" onClick={() => parseInput()}>Pfade neu lesen</button>
          <button className="ghost-button" onClick={refreshGenerationJobs}>Jobs neu laden</button>
          <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue öffnen</a>
          <a className="ghost-link" href="#/ricco-image-review">Image Review öffnen</a>
          <a className="ghost-link" href="#/ricco-storage">Storage prüfen</a>
        </div>
      </div>

      <div className="grid two-col">
        <section className="card prompt-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Input</p>
              <h3>Ein Pfad pro Zeile</h3>
            </div>
            <button className="ghost-button" onClick={() => parseInput()}>Parse</button>
          </div>

          <label>Optionaler manueller Override aus Generation Queue</label>
          <select value={selectedJobId} onChange={(event) => handleJobChange(event.target.value)}>
            <option value="">Kein manueller Override</option>
            {generationJobs.map((job) => (
              <option key={job.id} value={job.id}>{job.notes ?? job.id} · {job.status}</option>
            ))}
          </select>

          <label>Fallback Panel, falls Dateiname nicht erkannt wird</label>
          <select value={fallbackPanelId} onChange={(event) => setFallbackPanelId(event.target.value)}>
            {riccoPanels.map((panel) => (
              <option key={panel.id} value={panel.id}>Panel {panel.panelNumber}: {panel.title}</option>
            ))}
          </select>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} style={{ minHeight: 300 }} />
        </section>

        <section className="card rule-card">
          <p className="eyebrow">M1 Workflow</p>
          <h3>So nutzt du public/generated</h3>
          <ul>
            <li>ComfyUI Bilder als PNG/JPG/WEBP exportieren.</li>
            <li>In der App lokal den Ordner public/generated/ anlegen.</li>
            <li>Dateien dort reinlegen, z. B. panel_001_v1.png.</li>
            <li>Die Seite sucht den passenden Job pro Panel automatisch.</li>
            <li>Optional kannst du für Spezialfälle einen Job manuell überschreiben.</li>
            <li>Danach im Image Review bewerten und Finalbild wählen.</li>
          </ul>
        </section>
      </div>

      {selectedGenerationJob && (
        <section className="card prompt-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Selected Override Job</p>
              <h3>{selectedGenerationJob.notes ?? selectedGenerationJob.id}</h3>
            </div>
            <span className="status-badge status-needs_fix">{selectedGenerationJob.status}</span>
          </div>
          <div className="shot-meta">
            <span>{selectedGenerationJob.workflowId}</span>
            <span>{selectedGenerationJob.resolutionWidth}×{selectedGenerationJob.resolutionHeight}</span>
            <span>{selectedGenerationJob.outputPath}</span>
          </div>
          <label>Prompt aus Job</label>
          <textarea readOnly value={selectedGenerationJob.positivePrompt} />
        </section>
      )}

      <section className="page-stack compact-stack">
        <div className="section-header">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{rows.length} Pfade vorbereitet</h2>
          </div>
          <span className="status-badge status-active">{readyRows.length} ready</span>
        </div>

        {groupedByPanel.map(({ panel, rows: panelRows }) => {
          if (panelRows.length === 0) return null;

          return (
            <article className="card" key={panel.id}>
              <div className="card-header">
                <div>
                  <p className="eyebrow">Panel {panel.panelNumber}</p>
                  <h3>{panel.title}</h3>
                </div>
                <span className="status-badge">{panelRows.length} Assets</span>
              </div>

              <div className="grid two-col">
                {panelRows.map((row) => (
                  <div className="card export-card" key={row.id}>
                    <div className="mock-preview image-preview" style={row.valid ? { backgroundImage: `url(${row.normalizedPath})` } : undefined}>
                      <span>{row.normalizedPath}</span>
                      <strong>{row.valid ? 'PUBLIC' : 'INVALID'}</strong>
                    </div>

                    <label>Zielpanel</label>
                    <select value={row.panelId} onChange={(event) => updateRowPanel(row.id, event.target.value)}>
                      {riccoPanels.map((targetPanel) => (
                        <option key={targetPanel.id} value={targetPanel.id}>Panel {targetPanel.panelNumber}: {targetPanel.title}</option>
                      ))}
                    </select>

                    <div className="dialogue-box">
                      <p className="eyebrow">Status</p>
                      <p>{row.note}</p>
                      {row.generationJobId && <p>Generation Job: {row.generationJobId}</p>}
                      {row.promptId && <p>Prompt: {row.promptId}</p>}
                      <p>Match: {row.jobMatch}</p>
                    </div>

                    <div className="review-actions">
                      <button className="ghost-button" onClick={() => removeRow(row.id)}>Entfernen</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </section>
  );
}
