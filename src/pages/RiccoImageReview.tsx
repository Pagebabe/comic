import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { riccoEpisode, riccoPanels } from '../data/riccoStudio';
import {
  buildLocalFileReviewImage,
  buildManualReviewImage,
  deleteRiccoReviewImage,
  getPanelReviewImages,
  MAX_LOCAL_FILE_BYTES,
  selectFinalRiccoReviewImage,
  summarizeRiccoReviewImages,
  updateRiccoReviewImage
} from '../domain/review/riccoReviewState';
import { RICCO_IMAGES_STORAGE_KEY } from '../lib/backend/localProductionStore';
import type { ImageSource, RiccoPanelImage } from '../types/riccoReview';

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(RICCO_IMAGES_STORAGE_KEY);
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
    reader.onerror = () => reject(new Error('Bilddatei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}

export function RiccoImageReview() {
  const [selectedPanelId, setSelectedPanelId] = useState(riccoPanels[0]?.id ?? '');
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [source, setSource] = useState<ImageSource>('manual_url');
  const [promptUsed, setPromptUsed] = useState('');
  const [fileStatus, setFileStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(RICCO_IMAGES_STORAGE_KEY, JSON.stringify(images));
    } catch {
      setFileStatus('Speicher voll. Nutze kleinere Bilder oder JSON Package sichern.');
    }
  }, [images]);

  const selectedPanel = useMemo(() => {
    return riccoPanels.find((panel) => panel.id === selectedPanelId) ?? riccoPanels[0];
  }, [selectedPanelId]);

  const panelImages = useMemo(() => {
    if (!selectedPanel) return [];
    return getPanelReviewImages(images, selectedPanel.id);
  }, [images, selectedPanel]);

  const reviewSummary = useMemo(() => summarizeRiccoReviewImages(images), [images]);

  function addImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPanel) return;
    const cleanUrl = imageUrl.trim();

    if (!cleanUrl) {
      window.alert('Bild-URL fehlt.');
      return;
    }

    const nextImage = buildManualReviewImage({
      panelId: selectedPanel.id,
      imageUrl: cleanUrl,
      source,
      promptUsed
    });

    setImages((current) => [nextImage, ...current]);
    setImageUrl('');
    setPromptUsed('');
    setFileStatus('Bild-URL gespeichert.');
  }

  async function addLocalFile(event: ChangeEvent<HTMLInputElement>) {
    if (!selectedPanel) return;

    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileStatus('Bitte eine Bilddatei auswählen.');
      return;
    }

    if (file.size > MAX_LOCAL_FILE_BYTES) {
      setFileStatus('Bild ist zu groß für Browser-Speicher. Bitte kleiner exportieren oder per URL eintragen.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const nextImage = buildLocalFileReviewImage({
        panelId: selectedPanel.id,
        dataUrl,
        fileName: file.name,
        promptUsed
      });

      setImages((current) => [nextImage, ...current]);
      setFileStatus(`${file.name} gespeichert.`);
    } catch {
      setFileStatus('Bilddatei konnte nicht gelesen werden.');
    }
  }

  function updateImage(imageIdValue: string, patch: Partial<RiccoPanelImage>) {
    setImages((current) => updateRiccoReviewImage(current, imageIdValue, patch));
  }

  function selectFinalImage(imageIdValue: string) {
    setImages((current) => selectFinalRiccoReviewImage(current, imageIdValue));
  }

  function deleteImage(imageIdValue: string) {
    setImages((current) => deleteRiccoReviewImage(current, imageIdValue));
  }

  function resetReviewState() {
    const ok = window.confirm('Alle gespeicherten Ricco-Review-Bilder aus dem Browser löschen?');
    if (!ok) return;
    setImages([]);
    window.localStorage.removeItem(RICCO_IMAGES_STORAGE_KEY);
    setFileStatus('Review-Stand gelöscht.');
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Image Review v0.3</p>
        <h2>{riccoEpisode.title} · Finalbilder auswählen</h2>
        <p className="body-copy">
          Trage generierte Bild-URLs ein oder lade lokale Bilddateien direkt hoch. Danach bewertest du Qualität und Continuity und wählst genau ein Finalbild pro Panel.
        </p>
        <div className="chips">
          <span>{images.length} Bilder gespeichert</span>
          <span>{reviewSummary.generationLinkedCount} mit Generation Job</span>
          <span>{reviewSummary.finalCount}/{riccoPanels.length} Finalbilder</span>
          <span>{reviewSummary.progress}% exportbereit</span>
          {fileStatus && <span>{fileStatus}</span>}
        </div>
      </div>

      <div className="grid two-col">
        <aside className="card sticky-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Panel Auswahl</p>
              <h3>{selectedPanel ? `Panel ${selectedPanel.panelNumber}: ${selectedPanel.title}` : 'Kein Panel'}</h3>
            </div>
            <button className="ghost-button" onClick={resetReviewState}>Reset</button>
          </div>

          <label>Panel</label>
          <select value={selectedPanel?.id ?? ''} onChange={(event) => setSelectedPanelId(event.target.value)}>
            {riccoPanels.map((panel) => {
              const panelHasFinal = reviewSummary.finalPanelIds.has(panel.id);
              return (
                <option key={panel.id} value={panel.id}>
                  Panel {panel.panelNumber}: {panel.title}{panelHasFinal ? ' ✓' : ''}
                </option>
              );
            })}
          </select>

          {selectedPanel && (
            <div className="page-stack compact-stack">
              <div className="dialogue-box">
                <p className="eyebrow">Action</p>
                <p>{selectedPanel.action}</p>
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Dialogue Overlay</p>
                <p>{selectedPanel.dialogue}</p>
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Lokale Datei</p>
                <p>Für ComfyUI/Downloads: PNG, JPG oder WEBP direkt auswählen. Große Dateien bitte vorher kleiner exportieren.</p>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={addLocalFile} />
              </div>

              <form className="page-stack compact-stack" onSubmit={addImage}>
                <div>
                  <label>Oder Bild-URL</label>
                  <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
                </div>

                <div>
                  <label>Quelle</label>
                  <select value={source} onChange={(event) => setSource(event.target.value as ImageSource)}>
                    <option value="manual_url">manual_url</option>
                    <option value="local_file">local_file</option>
                    <option value="public_asset">public_asset</option>
                    <option value="generation_job_public_asset">generation_job_public_asset</option>
                    <option value="comfyui">comfyui</option>
                    <option value="openai">openai</option>
                    <option value="midjourney">midjourney</option>
                    <option value="other">other</option>
                  </select>
                </div>

                <div>
                  <label>Prompt Used optional</label>
                  <textarea value={promptUsed} onChange={(event) => setPromptUsed(event.target.value)} placeholder="Prompt hier optional einfügen..." />
                </div>

                <button className="primary-button" type="submit">Bild-URL speichern</button>
              </form>
            </div>
          )}
        </aside>

        <div className="page-stack compact-stack">
          <div className="section-header">
            <div>
              <p className="eyebrow">Bilder</p>
              <h2>{panelImages.length} Varianten für dieses Panel</h2>
            </div>
            <div className="review-actions">
              <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue öffnen</a>
              <a className="ghost-link" href="#/ricco-prompt-queue">Prompt Queue öffnen</a>
            </div>
          </div>

          {panelImages.length === 0 && (
            <div className="hero-card">
              <p className="eyebrow">Leer</p>
              <h2>Noch keine Bilder für dieses Panel</h2>
              <p className="body-copy">Erzeuge zuerst Bilder extern mit der Prompt Queue oder Generation Queue und füge hier die Datei oder Bild-URL ein.</p>
            </div>
          )}

          <div className="grid two-col">
            {panelImages.map((image) => (
              <article className="card export-card" key={image.id} style={image.selected ? { borderColor: 'rgba(120,255,170,0.42)' } : undefined}>
                <div className="mock-preview image-preview" style={{ backgroundImage: `url(${image.imageUrl})` }}>
                  <span>{image.source}</span>
                  <strong>{image.selected ? 'FINAL' : 'VARIANT'}</strong>
                </div>

                <div className="card-header">
                  <div>
                    <p className="eyebrow">Review</p>
                    <h3>{image.selected ? 'Final gewählt' : 'Variante prüfen'}</h3>
                  </div>
                  <span className={`status-badge ${image.selected ? 'status-active' : ''}`}>{image.selected ? 'final' : 'open'}</span>
                </div>

                {(image.generationJobId || image.promptId) && (
                  <div className="dialogue-box">
                    <p className="eyebrow">Production Link</p>
                    {image.generationJobId && <p>Generation Job: {image.generationJobId}</p>}
                    {image.promptId && <p>Prompt: {image.promptId}</p>}
                  </div>
                )}

                <div className="grid two-col">
                  <ScoreSelect label="Rating" value={image.rating} onChange={(value) => updateImage(image.id, { rating: value })} />
                  <ScoreSelect label="Continuity" value={image.continuityScore} onChange={(value) => updateImage(image.id, { continuityScore: value })} />
                </div>

                <div>
                  <label>Notizen</label>
                  <textarea value={image.notes} onChange={(event) => updateImage(image.id, { notes: event.target.value })} placeholder="Was stimmt? Was ist falsch?" />
                </div>

                {image.promptUsed && (
                  <details className="dialogue-box">
                    <summary>Prompt anzeigen</summary>
                    <p>{image.promptUsed}</p>
                  </details>
                )}

                <div className="review-actions">
                  <button className="primary-button" onClick={() => selectFinalImage(image.id)}>Als final wählen</button>
                  <button className="ghost-button" onClick={() => deleteImage(image.id)}>Löschen</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        <option value={0}>nicht bewertet</option>
        <option value={1}>1 — schlecht</option>
        <option value={2}>2 — falsche Richtung</option>
        <option value={3}>3 — brauchbar</option>
        <option value={4}>4 — fast final</option>
        <option value={5}>5 — final</option>
      </select>
    </div>
  );
}
