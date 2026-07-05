import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
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
import {
  readRiccoImagesPreferred,
  readRiccoReviewImages,
  writeRiccoImageStorageSplit,
  writeRiccoReviewImages
} from '../lib/backend/localProductionStore';
import { revokeRiccoObjectUrls } from '../lib/storage/riccoBlobPayload';
import { writeRiccoImageBlobsToIndexedDb } from '../lib/storage/riccoIndexedDbStorage';
import type { ImageSource, RiccoPanelImage } from '../types/riccoReview';

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Bilddatei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}

function scoreHelp(label: string) {
  if (label === 'Rating') return 'Wie gut ist das Bild insgesamt? 4 reicht für den Rough-Test.';
  return 'Passt das Bild noch zu Figuren, Ort und Stil der Serie?';
}

function panelReviewStatus(panelImages: RiccoPanelImage[], finalImage?: RiccoPanelImage) {
  if (finalImage) return { label: 'Final gewählt', className: 'status-active', next: 'Weiter zu Add Text.' };
  if (panelImages.length > 0) return { label: 'Final fehlt', className: 'status-needs_fix', next: 'Beste Variante auswählen.' };
  return { label: 'Bilder fehlen', className: 'status-rejected', next: 'Erst Varianten hochladen.' };
}

export function RiccoImageReview() {
  const [selectedPanelId, setSelectedPanelId] = useState(riccoPanels[0]?.id ?? '');
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [previewUrlsById, setPreviewUrlsById] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState('');
  const [source, setSource] = useState<ImageSource>('manual_url');
  const [promptUsed, setPromptUsed] = useState('');
  const [fileStatus, setFileStatus] = useState('Bilder werden geladen...');
  const objectUrlsRef = useRef<string[]>([]);
  const hasLoadedRef = useRef(false);

  function revokePreviewObjectUrls() {
    revokeRiccoObjectUrls(objectUrlsRef.current);
    objectUrlsRef.current = [];
  }

  async function refreshPreviewUrls() {
    const preferred = await readRiccoImagesPreferred();
    revokePreviewObjectUrls();
    objectUrlsRef.current = preferred.objectUrls;
    setPreviewUrlsById(Object.fromEntries(preferred.images.map((image) => [image.id, image.imageUrl])));
    setFileStatus(`Bilder geladen · Quelle: ${preferred.source}`);
  }

  async function writeThroughStorage(nextImages: RiccoPanelImage[]) {
    writeRiccoReviewImages(nextImages);
    const splitResult = writeRiccoImageStorageSplit(nextImages);
    if (splitResult.split.imageBlobs.length > 0) {
      await writeRiccoImageBlobsToIndexedDb(splitResult.split.imageBlobs);
    }
    await refreshPreviewUrls();
  }

  useEffect(() => {
    let active = true;

    async function loadImages() {
      const legacyImages = readRiccoReviewImages();
      const preferred = await readRiccoImagesPreferred();
      const baseImages = legacyImages.length > 0 ? legacyImages : preferred.images;

      if (!active) return;
      objectUrlsRef.current = preferred.objectUrls;
      setPreviewUrlsById(Object.fromEntries(preferred.images.map((image) => [image.id, image.imageUrl])));
      setImages(baseImages);
      hasLoadedRef.current = true;
      setFileStatus(`Bilder geladen · Quelle: ${preferred.source}`);

      if (legacyImages.length > 0) {
        await writeThroughStorage(legacyImages);
      }
    }

    loadImages();

    return () => {
      active = false;
      revokePreviewObjectUrls();
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;

    writeThroughStorage(images).catch(() => {
      setFileStatus('Speichern fehlgeschlagen. Bitte Storage Safety prüfen.');
    });
  }, [images]);

  const selectedPanel = useMemo(() => {
    return riccoPanels.find((panel) => panel.id === selectedPanelId) ?? riccoPanels[0];
  }, [selectedPanelId]);

  const panelImages = useMemo(() => {
    if (!selectedPanel) return [];
    return getPanelReviewImages(images, selectedPanel.id);
  }, [images, selectedPanel]);

  const reviewSummary = useMemo(() => summarizeRiccoReviewImages(images), [images]);
  const finalImage = panelImages.find((image) => image.selected);
  const currentStatus = panelReviewStatus(panelImages, finalImage);

  function previewUrlForImage(image: RiccoPanelImage) {
    return previewUrlsById[image.id] || image.imageUrl;
  }

  function addImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPanel) return;
    const cleanUrl = imageUrl.trim();

    if (!cleanUrl) {
      setFileStatus('Bitte erst eine Bild-URL eintragen.');
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
    setFileStatus('Bild-URL gespeichert. Jetzt bewerten und Final wählen.');
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
      setFileStatus('Bild ist zu groß. Bitte kleiner exportieren oder per URL eintragen.');
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
      setFileStatus(`${file.name} gespeichert. Jetzt bewerten und Final wählen.`);
    } catch {
      setFileStatus('Bilddatei konnte nicht gelesen werden.');
    }
  }

  function updateImage(imageIdValue: string, patch: Partial<RiccoPanelImage>) {
    setImages((current) => updateRiccoReviewImage(current, imageIdValue, patch));
  }

  function selectFinalImage(imageIdValue: string) {
    setImages((current) => selectFinalRiccoReviewImage(current, imageIdValue));
    setFileStatus('Finalbild gewählt. Danach geht es zu Add Text.');
  }

  function deleteImage(imageIdValue: string) {
    setImages((current) => deleteRiccoReviewImage(current, imageIdValue));
  }

  function resetReviewState() {
    const ok = window.confirm('Alle gespeicherten Review-Bilder aus dem Browser löschen? Vorher besser Backup speichern.');
    if (!ok) return;
    revokePreviewObjectUrls();
    setImages([]);
    setPreviewUrlsById({});
    writeRiccoReviewImages([]);
    setFileStatus('Review-Stand gelöscht.');
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Choose Images</p>
        <h2>{riccoEpisode.title} · Finalbilder auswählen</h2>
        <p className="body-copy">
          Lade Bildvarianten hoch, bewerte sie grob und wähle pro Panel genau ein Finalbild. Für den Rough-Test reicht ein verständliches Bild.
        </p>
        <div className="chips">
          <span>{images.length} Varianten</span>
          <span>{reviewSummary.finalCount}/{riccoPanels.length} Finalbilder</span>
          <span>{reviewSummary.progress}% bereit</span>
          <span>{selectedPanel ? `Aktuell: Panel ${selectedPanel.panelNumber}` : 'Kein Panel'}</span>
          <span>{currentStatus.label}</span>
          {fileStatus && <span>{fileStatus}</span>}
        </div>
      </div>

      <section className="card rule-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">So benutzt du diese Seite</p>
            <h3>Upload → Bewerten → Final wählen → Add Text</h3>
          </div>
          <span className={`status-badge ${currentStatus.className}`}>{currentStatus.label}</span>
        </div>
        <p className="body-copy"><strong>Nächster Schritt:</strong> {currentStatus.next}</p>
        <div className="chips">
          <span>1. Panel wählen</span>
          <span>2. Bild hochladen</span>
          <span>3. Rating setzen</span>
          <span>4. Continuity prüfen</span>
          <span>5. Als Final wählen</span>
        </div>
      </section>

      <div className="grid two-col">
        <aside className="card sticky-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Aktuelles Panel</p>
              <h3>{selectedPanel ? `Panel ${selectedPanel.panelNumber}: ${selectedPanel.title}` : 'Kein Panel'}</h3>
            </div>
            <button className="ghost-button" onClick={resetReviewState}>Reset</button>
          </div>

          <label>Panel auswählen</label>
          <select value={selectedPanel?.id ?? ''} onChange={(event) => setSelectedPanelId(event.target.value)}>
            {riccoPanels.map((panel) => {
              const panelHasFinal = reviewSummary.finalPanelIds.has(panel.id);
              return (
                <option key={panel.id} value={panel.id}>
                  Panel {panel.panelNumber}: {panel.title}{panelHasFinal ? ' ✓ final' : ''}
                </option>
              );
            })}
          </select>

          {selectedPanel && (
            <div className="page-stack compact-stack">
              <div className="dialogue-box">
                <p className="eyebrow">Bild muss zeigen</p>
                <p>{selectedPanel.action}</p>
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Text kommt später</p>
                <p>{selectedPanel.dialogue}</p>
                <small>Nicht ins Bild generieren. Der Text kommt auf der Add-Text-Seite.</small>
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Entscheidungsregel</p>
                <p>Wähle nicht das schönste Bild. Wähle das Bild, das die Szene am klarsten erzählt.</p>
                <p>Gut genug ist besser als endlos neu rendern.</p>
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Checkliste</p>
                <p>{panelImages.length >= 2 ? '✓' : '□'} Mindestens 2 Varianten, wenn möglich.</p>
                <p>{finalImage ? '✓' : '□'} Ein Finalbild gewählt.</p>
                <p>□ Keine Sprechblasen im Bild.</p>
                <p>□ Story ist sofort verständlich.</p>
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Lokale Datei hochladen</p>
                <p>PNG, JPG oder WEBP auswählen. Danach unten bewerten und Final wählen.</p>
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
                    <option value="manual_url">Bild-URL</option>
                    <option value="local_file">Lokale Datei</option>
                    <option value="public_asset">Public Asset</option>
                    <option value="generation_job_public_asset">Generation Job</option>
                    <option value="comfyui">ComfyUI</option>
                    <option value="openai">OpenAI</option>
                    <option value="midjourney">Midjourney</option>
                    <option value="other">Andere Quelle</option>
                  </select>
                </div>

                <div>
                  <label>Prompt optional</label>
                  <textarea value={promptUsed} onChange={(event) => setPromptUsed(event.target.value)} placeholder="Optional: Prompt hier einfügen..." />
                </div>

                <button className="primary-button" type="submit">Bild-URL speichern</button>
              </form>
            </div>
          )}
        </aside>

        <div className="page-stack compact-stack">
          <div className="section-header">
            <div>
              <p className="eyebrow">Varianten</p>
              <h2>{panelImages.length} Bilder für dieses Panel</h2>
            </div>
            <div className="review-actions">
              {finalImage && <a className="primary-button" href="#/ricco-lettering">Weiter zu Add Text</a>}
              <a className="ghost-link" href="#/ricco-prompt-queue">Make Images</a>
              <a className="ghost-link" href="#/ricco-storage">Storage Safety</a>
            </div>
          </div>

          {finalImage && (
            <section className="card rule-card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">Bereit</p>
                  <h3>Dieses Panel hat ein Finalbild</h3>
                </div>
                <span className="status-badge status-active">final</span>
              </div>
              <p className="body-copy">Nächster Schritt: Text auf das Bild setzen. Der Dialog kommt erst dort ins Panel.</p>
              <div className="review-actions">
                <a className="primary-button" href="#/ricco-lettering">Add Text öffnen</a>
              </div>
            </section>
          )}

          {panelImages.length === 0 && (
            <div className="hero-card">
              <p className="eyebrow">Noch leer</p>
              <h2>Für dieses Panel gibt es noch keine Bilder.</h2>
              <p className="body-copy">Gehe zu Make Images, erstelle Varianten und lade sie hier hoch.</p>
              <div className="review-actions">
                <a className="primary-button" href="#/ricco-prompt-queue">Make Images öffnen</a>
              </div>
            </div>
          )}

          <div className="grid two-col">
            {panelImages.map((image) => (
              <article className="card export-card" key={image.id} style={image.selected ? { borderColor: 'rgba(120,255,170,0.42)' } : undefined}>
                <div className="mock-preview image-preview" style={{ backgroundImage: `url(${previewUrlForImage(image)})` }}>
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

                <details className="dialogue-box">
                  <summary>i · Entscheidungshilfe</summary>
                  <p>Rating 4 reicht für den Rough-Test. Continuity 4 bedeutet: Figur, Ort und Stil passen genug.</p>
                  <p>Nicht regenerieren, wenn das Bild die Szene bereits klar erzählt.</p>
                </details>

                <div className="grid two-col">
                  <ScoreSelect label="Rating" value={image.rating} onChange={(value) => updateImage(image.id, { rating: value })} />
                  <ScoreSelect label="Continuity" value={image.continuityScore} onChange={(value) => updateImage(image.id, { continuityScore: value })} />
                </div>

                <div>
                  <label>Notiz</label>
                  <textarea value={image.notes} onChange={(event) => updateImage(image.id, { notes: event.target.value })} placeholder="Kurz: Warum ist das Bild brauchbar oder nicht?" />
                </div>

                {image.promptUsed && (
                  <details className="dialogue-box">
                    <summary>Prompt anzeigen</summary>
                    <p>{image.promptUsed}</p>
                  </details>
                )}

                <div className="review-actions">
                  <button className="primary-button" onClick={() => selectFinalImage(image.id)}>{image.selected ? 'Final bleibt gewählt' : 'Als Finalbild wählen'}</button>
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
      <small>{scoreHelp(label)}</small>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        <option value={0}>nicht bewertet</option>
        <option value={1}>1 — schlecht</option>
        <option value={2}>2 — falsche Richtung</option>
        <option value={3}>3 — brauchbar</option>
        <option value={4}>4 — gut genug</option>
        <option value={5}>5 — finalwürdig</option>
      </select>
    </div>
  );
}
