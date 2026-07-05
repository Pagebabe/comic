import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { riccoPanels } from '../data/riccoStudio';

type ImageSource = 'local_file' | 'bulk_upload';

type RiccoPanelImage = {
  id: string;
  panelId: string;
  imageUrl: string;
  source: ImageSource | string;
  promptUsed: string;
  rating: number;
  continuityScore: number;
  notes: string;
  selected: boolean;
  createdAt: string;
};

type UploadPreview = {
  id: string;
  fileName: string;
  fileSize: number;
  dataUrl: string;
  panelId: string;
  status: 'ready' | 'too_big' | 'invalid';
  note: string;
};

const STORAGE_KEY = 'ricco-studio-images-v1';
const MAX_LOCAL_FILE_BYTES = 3_500_000;

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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('file_read_failed'));
    reader.readAsDataURL(file);
  });
}

function inferPanelId(fileName: string, fallbackPanelId: string) {
  const lower = fileName.toLowerCase();
  const matches = [
    lower.match(/panel[_\-\s]?0?(\d{1,2})/),
    lower.match(/p[_\-\s]?0?(\d{1,2})/),
    lower.match(/^0?(\d{1,2})[_\-\s]/),
    lower.match(/[_\-\s]0?(\d{1,2})[_\-\s]/)
  ].filter(Boolean) as RegExpMatchArray[];

  for (const match of matches) {
    const panelNumber = Number(match[1]);
    const panel = riccoPanels.find((item) => item.panelNumber === panelNumber);
    if (panel) return panel.id;
  }

  return fallbackPanelId;
}

function formatBytes(value: number) {
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

export function RiccoBulkUpload() {
  const [fallbackPanelId, setFallbackPanelId] = useState(riccoPanels[0]?.id ?? '');
  const [previews, setPreviews] = useState<UploadPreview[]>([]);
  const [storedCount, setStoredCount] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setStoredCount(readStoredImages().length);
  }, []);

  const readyPreviews = previews.filter((preview) => preview.status === 'ready');
  const blockedPreviews = previews.filter((preview) => preview.status !== 'ready');

  const groupedByPanel = useMemo(() => {
    return riccoPanels.map((panel) => ({
      panel,
      files: previews.filter((preview) => preview.panelId === panel.id)
    }));
  }, [previews]);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) return;

    const next: UploadPreview[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        next.push({
          id: imageId(),
          fileName: file.name,
          fileSize: file.size,
          dataUrl: '',
          panelId: fallbackPanelId,
          status: 'invalid',
          note: 'Keine Bilddatei.'
        });
        continue;
      }

      if (file.size > MAX_LOCAL_FILE_BYTES) {
        next.push({
          id: imageId(),
          fileName: file.name,
          fileSize: file.size,
          dataUrl: '',
          panelId: inferPanelId(file.name, fallbackPanelId),
          status: 'too_big',
          note: `Zu groß: ${formatBytes(file.size)}. Max ${formatBytes(MAX_LOCAL_FILE_BYTES)}.`
        });
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        next.push({
          id: imageId(),
          fileName: file.name,
          fileSize: file.size,
          dataUrl,
          panelId: inferPanelId(file.name, fallbackPanelId),
          status: 'ready',
          note: 'Bereit zum Speichern.'
        });
      } catch {
        next.push({
          id: imageId(),
          fileName: file.name,
          fileSize: file.size,
          dataUrl: '',
          panelId: fallbackPanelId,
          status: 'invalid',
          note: 'Datei konnte nicht gelesen werden.'
        });
      }
    }

    setPreviews((current) => [...next, ...current]);
    setStatus(`${next.length} Dateien geprüft.`);
  }

  function updatePreviewPanel(previewId: string, panelId: string) {
    setPreviews((current) => current.map((preview) => (preview.id === previewId ? { ...preview, panelId } : preview)));
  }

  function removePreview(previewId: string) {
    setPreviews((current) => current.filter((preview) => preview.id !== previewId));
  }

  function clearQueue() {
    setPreviews([]);
    setStatus('Upload-Queue geleert.');
  }

  function saveReadyFiles() {
    if (readyPreviews.length === 0) {
      setStatus('Keine speicherbaren Dateien in der Queue.');
      return;
    }

    const current = readStoredImages();

    const nextImages: RiccoPanelImage[] = readyPreviews.map((preview) => ({
      id: imageId(),
      panelId: preview.panelId,
      imageUrl: preview.dataUrl,
      source: 'bulk_upload',
      promptUsed: '',
      rating: 0,
      continuityScore: 0,
      notes: `Bulk Upload: ${preview.fileName}`,
      selected: false,
      createdAt: new Date().toISOString()
    }));

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...nextImages, ...current]));
      setStoredCount(current.length + nextImages.length);
      setPreviews((currentPreviews) => currentPreviews.filter((preview) => preview.status !== 'ready'));
      setStatus(`${nextImages.length} Bilder gespeichert.`);
    } catch {
      setStatus('Speicher voll. Weniger oder kleinere Bilder nutzen und Package sichern.');
    }
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Bulk Upload v0.1</p>
        <h2>Image Inbox für mehrere Varianten</h2>
        <p className="body-copy">
          Lade mehrere generierte Bilder auf einmal hoch. Dateinamen wie panel_001, panel-2 oder p03 werden automatisch passenden Panels zugeordnet.
        </p>
        <div className="chips">
          <span>{storedCount} gespeicherte Bilder</span>
          <span>{readyPreviews.length} bereit</span>
          <span>{blockedPreviews.length} blockiert</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={saveReadyFiles}>Bereite Dateien speichern</button>
          <button className="ghost-button" onClick={clearQueue}>Queue leeren</button>
          <a className="ghost-link" href="#/ricco-image-review">Image Review öffnen</a>
          <a className="ghost-link" href="#/ricco-qa">Gate prüfen</a>
        </div>
      </div>

      <div className="grid two-col">
        <section className="card">
          <p className="eyebrow">Upload</p>
          <h3>Dateien auswählen</h3>
          <p className="body-copy">Mehrere PNG/JPG/WEBP auswählen. Kleine Dateien funktionieren am besten, weil sie im Browser gespeichert werden.</p>
          <label>Fallback Panel, falls Dateiname nicht erkannt wird</label>
          <select value={fallbackPanelId} onChange={(event) => setFallbackPanelId(event.target.value)}>
            {riccoPanels.map((panel) => (
              <option key={panel.id} value={panel.id}>Panel {panel.panelNumber}: {panel.title}</option>
            ))}
          </select>
          <div className="dialogue-box">
            <p className="eyebrow">Dateinamen-Regel</p>
            <p>Erkannt werden z. B. panel_001.png, panel-2.webp, p03.jpg oder 04_variant.png.</p>
          </div>
          <input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={handleFiles} />
        </section>

        <section className="card rule-card">
          <p className="eyebrow">Praxis</p>
          <h3>Empfohlene Dateinamen</h3>
          <ul>
            <li>panel_001_v1.png</li>
            <li>panel_001_v2.png</li>
            <li>panel_002_v1.webp</li>
            <li>p03_fix_face.jpg</li>
          </ul>
        </section>
      </div>

      <section className="page-stack compact-stack">
        <div className="section-header">
          <div>
            <p className="eyebrow">Queue</p>
            <h2>{previews.length} Dateien in Vorbereitung</h2>
          </div>
          <span className="status-badge status-active">{readyPreviews.length} ready</span>
        </div>

        {previews.length === 0 && (
          <div className="hero-card">
            <p className="eyebrow">Leer</p>
            <h2>Noch keine Dateien ausgewählt</h2>
            <p className="body-copy">Wähle mehrere Bilder aus deinem Generator-Output und speichere sie danach gesammelt ins Review.</p>
          </div>
        )}

        {groupedByPanel.map(({ panel, files }) => {
          if (files.length === 0) return null;

          return (
            <article className="card" key={panel.id}>
              <div className="card-header">
                <div>
                  <p className="eyebrow">Panel {panel.panelNumber}</p>
                  <h3>{panel.title}</h3>
                </div>
                <span className="status-badge">{files.length} Dateien</span>
              </div>

              <div className="grid two-col">
                {files.map((file) => (
                  <div className="card export-card" key={file.id} style={file.status === 'ready' ? { borderColor: 'rgba(120,255,170,0.24)' } : { borderColor: 'rgba(255,100,100,0.24)' }}>
                    {file.dataUrl ? (
                      <div className="mock-preview image-preview" style={{ backgroundImage: `url(${file.dataUrl})` }}>
                        <span>{file.fileName}</span>
                        <strong>{file.status}</strong>
                      </div>
                    ) : (
                      <div className="mock-preview">
                        <span>{file.fileName}</span>
                        <strong>{file.status}</strong>
                      </div>
                    )}

                    <label>Zielpanel</label>
                    <select value={file.panelId} onChange={(event) => updatePreviewPanel(file.id, event.target.value)}>
                      {riccoPanels.map((targetPanel) => (
                        <option key={targetPanel.id} value={targetPanel.id}>Panel {targetPanel.panelNumber}: {targetPanel.title}</option>
                      ))}
                    </select>

                    <div className="dialogue-box">
                      <p className="eyebrow">Status</p>
                      <p>{file.note}</p>
                      <p>{formatBytes(file.fileSize)}</p>
                    </div>

                    <div className="review-actions">
                      <button className="ghost-button" onClick={() => removePreview(file.id)}>Entfernen</button>
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
