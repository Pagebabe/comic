import { useMemo, useState } from 'react';
import { riccoPanels } from '../data/riccoStudio';

type RiccoPanelImage = {
  id: string;
  panelId: string;
  imageUrl: string;
  source: string;
  promptUsed: string;
  rating: number;
  continuityScore: number;
  notes: string;
  selected: boolean;
  createdAt: string;
};

type AssetRow = {
  id: string;
  rawPath: string;
  normalizedPath: string;
  panelId: string;
  valid: boolean;
  note: string;
};

const STORAGE_KEY = 'ricco-studio-images-v1';
const EXAMPLE_INPUT = [
  '/generated/panel_001_v1.png',
  '/generated/panel_001_v2.png',
  '/generated/panel_002_v1.webp',
  '/generated/p03_fix_face.jpg',
  '/generated/04_variant.png'
].join('\n');

function imageId() {
  return `img_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
}

function normalizePath(value: string) {
  const clean = value.trim().replace(/^public\//, '').replace(/^\.\//, '');
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  return clean.startsWith('/') ? clean : `/${clean}`;
}

function isImagePath(value: string) {
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(value.split('?')[0]);
}

function inferPanelId(filePath: string, fallbackPanelId: string) {
  const fileName = filePath.split('/').pop()?.toLowerCase() ?? filePath.toLowerCase();
  const matches = [
    fileName.match(/panel[_\-\s]?0?(\d{1,2})/),
    fileName.match(/p[_\-\s]?0?(\d{1,2})/),
    fileName.match(/^0?(\d{1,2})[_\-\s]/),
    fileName.match(/[_\-\s]0?(\d{1,2})[_\-\s]/)
  ].filter(Boolean) as RegExpMatchArray[];

  for (const match of matches) {
    const panelNumber = Number(match[1]);
    const panel = riccoPanels.find((item) => item.panelNumber === panelNumber);
    if (panel) return panel.id;
  }

  return fallbackPanelId;
}

function buildRows(input: string, fallbackPanelId: string): AssetRow[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((rawPath) => {
      const normalizedPath = normalizePath(rawPath);
      const valid = Boolean(normalizedPath) && isImagePath(normalizedPath);
      return {
        id: imageId(),
        rawPath,
        normalizedPath,
        panelId: inferPanelId(normalizedPath, fallbackPanelId),
        valid,
        note: valid ? 'Bereit zum Import.' : 'Kein erkannter Bildpfad.'
      };
    });
}

export function RiccoAssetImport() {
  const [fallbackPanelId, setFallbackPanelId] = useState(riccoPanels[0]?.id ?? '');
  const [input, setInput] = useState(EXAMPLE_INPUT);
  const [rows, setRows] = useState<AssetRow[]>(() => buildRows(EXAMPLE_INPUT, riccoPanels[0]?.id ?? ''));
  const [status, setStatus] = useState('');

  const readyRows = rows.filter((row) => row.valid);
  const blockedRows = rows.filter((row) => !row.valid);

  const groupedByPanel = useMemo(() => {
    return riccoPanels.map((panel) => ({
      panel,
      rows: rows.filter((row) => row.panelId === panel.id)
    }));
  }, [rows]);

  function parseInput() {
    const nextRows = buildRows(input, fallbackPanelId);
    setRows(nextRows);
    setStatus(`${nextRows.length} Pfade gelesen.`);
  }

  function updateRowPanel(rowId: string, panelId: string) {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, panelId } : row)));
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
    const nextImages: RiccoPanelImage[] = readyRows.map((row) => ({
      id: imageId(),
      panelId: row.panelId,
      imageUrl: row.normalizedPath,
      source: 'public_asset',
      promptUsed: '',
      rating: 0,
      continuityScore: 0,
      notes: `Public Asset: ${row.normalizedPath}`,
      selected: false,
      createdAt: new Date().toISOString()
    }));

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...nextImages, ...current]));
      setRows((currentRows) => currentRows.filter((row) => !row.valid));
      setStatus(`${nextImages.length} Public Assets ins Image Review importiert.`);
    } catch {
      setStatus('Import fehlgeschlagen. Browser-Speicher prüfen.');
    }
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Public Asset Import v0.1</p>
        <h2>Bildpfade statt Base64 speichern</h2>
        <p className="body-copy">
          Lege generierte Bilder in Vite unter public/generated/ ab und importiere hier nur die Pfade. Das spart Browser-Speicher und bleibt kompatibel mit Image Review, Gate, Lettering und Package.
        </p>
        <div className="chips">
          <span>{readyRows.length} bereit</span>
          <span>{blockedRows.length} blockiert</span>
          <span>source: public_asset</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={importReadyRows}>Bereite Pfade importieren</button>
          <button className="ghost-button" onClick={parseInput}>Pfade neu lesen</button>
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
            <button className="ghost-button" onClick={parseInput}>Parse</button>
          </div>
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
            <li>Hier /generated/panel_001_v1.png einfügen.</li>
            <li>Danach im Image Review bewerten und Finalbild wählen.</li>
          </ul>
        </section>
      </div>

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
