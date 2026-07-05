import { useEffect, useMemo, useState } from 'react';
import {
  assetStorageKey,
  buildAllReferencePacksCopyText,
  buildPackCopyText,
  buildReferenceReviewReport,
  countReferenceAssets,
  expectedReferenceAssetPath,
  filterReferencePacks,
  getReferenceAssetReview,
  packTypeLabel,
  referenceStatusClass,
  REFERENCE_REVIEW_STATUS_OPTIONS,
  riccoReferencePacks,
  type ReferenceAsset,
  type ReferencePack,
  type ReferenceSubjectType
} from '../domain/referencePacks/riccoReferencePacks';
import {
  readReferenceReviewStorage,
  writeReferenceReviewStorage
} from '../lib/backend/localProductionStore';
import {
  summarizeReferenceReviewState,
  type ReferenceAssetReview,
  type ReferenceReviewState,
  type ReferenceReviewStatus
} from '../types/riccoReferenceReview';

function updateReviewValue(
  current: ReferenceReviewState,
  pack: ReferencePack,
  asset: ReferenceAsset,
  patch: Partial<ReferenceAssetReview>
): ReferenceReviewState {
  const key = assetStorageKey(pack, asset);
  const previous = getReferenceAssetReview(current, pack, asset);

  return {
    ...current,
    [key]: {
      ...previous,
      ...patch,
      updatedAt: new Date().toISOString()
    }
  };
}

export function RiccoReferencePacks() {
  const [filter, setFilter] = useState<ReferenceSubjectType | 'all'>('character');
  const [selectedPackId, setSelectedPackId] = useState(riccoReferencePacks[0]?.id ?? '');
  const [copyStatus, setCopyStatus] = useState('');
  const [reviewState, setReviewState] = useState<ReferenceReviewState>(() => readReferenceReviewStorage());

  useEffect(() => {
    const ok = writeReferenceReviewStorage(reviewState);
    if (!ok) setCopyStatus('Reference Review konnte nicht gespeichert werden');
  }, [reviewState]);

  const filteredPacks = useMemo(() => filterReferencePacks(riccoReferencePacks, filter), [filter]);
  const selectedPack = riccoReferencePacks.find((pack) => pack.id === selectedPackId) ?? filteredPacks[0] ?? riccoReferencePacks[0];
  const referenceSummary = useMemo(() => summarizeReferenceReviewState(reviewState), [reviewState]);
  const totalAssets = countReferenceAssets(riccoReferencePacks);
  const filteredAssets = countReferenceAssets(filteredPacks);

  async function copyText(text: string, status: string) {
    await navigator.clipboard.writeText(text);
    setCopyStatus(status);
    window.setTimeout(() => setCopyStatus(''), 1600);
  }

  function handleFilter(nextFilter: ReferenceSubjectType | 'all') {
    setFilter(nextFilter);
    const firstPack = riccoReferencePacks.find((pack) => nextFilter === 'all' || pack.type === nextFilter);
    if (firstPack) setSelectedPackId(firstPack.id);
  }

  function updateAssetReview(pack: ReferencePack, asset: ReferenceAsset, patch: Partial<ReferenceAssetReview>) {
    setReviewState((current) => updateReviewValue(current, pack, asset, patch));
  }

  function resetReferenceReview() {
    const ok = window.confirm('Alle Reference-Pack-Review-Status im Browser löschen?');
    if (!ok) return;

    setReviewState({});
    writeReferenceReviewStorage({});
    setCopyStatus('Reference Review zurückgesetzt');
    window.setTimeout(() => setCopyStatus(''), 1600);
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Reference Packs v0.3</p>
        <h2>Figuren, Locations und Style stabilisieren</h2>
        <p className="body-copy">
          Bevor LoRA, API-Batch oder echte Serienproduktion Sinn machen, brauchen Ricco, Basti, Jule, Don Miau und die Hauptlocations stabile Referenzbilder. Diese Seite ist jetzt eine UI-Schicht über dem Reference-Pack-Domain-Modul.
        </p>
        <div className="chips">
          <span>{riccoReferencePacks.length} Packs</span>
          <span>{totalAssets} Referenz-Assets</span>
          <span>{referenceSummary.approved} approved</span>
          <span>{referenceSummary.candidate} candidates</span>
          <span>{referenceSummary.needsRedraw} redraw</span>
          <span>{referenceSummary.rejected} rejected</span>
          <span>{filteredPacks.length} gefiltert</span>
          <span>{filteredAssets} Assets gefiltert</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={() => copyText(buildPackCopyText(selectedPack, reviewState), `${selectedPack.title} kopiert`)}>Ausgewähltes Pack kopieren</button>
          <button className="ghost-button" onClick={() => copyText(buildAllReferencePacksCopyText(riccoReferencePacks, reviewState), 'Alle Reference Packs kopiert')}>Alle Packs kopieren</button>
          <button className="ghost-button" onClick={() => copyText(buildReferenceReviewReport(riccoReferencePacks, reviewState), 'Reference Review Report kopiert')}>Review Report kopieren</button>
          <button className="ghost-button" onClick={resetReferenceReview}>Review Reset</button>
          <a className="ghost-link" href="#/ricco-control">Ricco Control</a>
          <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue</a>
          <a className="ghost-link" href="#/ricco-image-review">Image Review</a>
        </div>
      </div>

      <div className="grid three-col">
        <button className={filter === 'character' ? 'primary-button' : 'ghost-button'} onClick={() => handleFilter('character')}>Characters</button>
        <button className={filter === 'location' ? 'primary-button' : 'ghost-button'} onClick={() => handleFilter('location')}>Locations</button>
        <button className={filter === 'style' ? 'primary-button' : 'ghost-button'} onClick={() => handleFilter('style')}>Style</button>
      </div>

      <div className="grid two-col">
        <aside className="card sticky-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Reference Pack</p>
              <h3>{selectedPack.title}</h3>
            </div>
            <span className="status-badge status-needs_fix">Priority {selectedPack.priority}</span>
          </div>

          <label>Pack auswählen</label>
          <select value={selectedPack.id} onChange={(event) => setSelectedPackId(event.target.value)}>
            {filteredPacks.map((pack) => (
              <option key={pack.id} value={pack.id}>{packTypeLabel(pack.type)} · {pack.title}</option>
            ))}
          </select>

          <div className="dialogue-box">
            <p className="eyebrow">Folder</p>
            <p>{selectedPack.folder}</p>
          </div>

          <div className="dialogue-box">
            <p className="eyebrow">Must Keep</p>
            <ul>{selectedPack.mustKeep.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          </div>

          <div className="dialogue-box">
            <p className="eyebrow">Forbidden Drift</p>
            <ul>{selectedPack.forbidden.slice(0, 10).map((rule) => <li key={rule}>{rule}</li>)}</ul>
          </div>
        </aside>

        <div className="page-stack compact-stack">
          <section className="card rule-card">
            <p className="eyebrow">Review Rule</p>
            <h3>Erst approve, dann weiter</h3>
            <ul>
              <li>Keine Sprechblasen im Bild.</li>
              <li>Kein lesbarer Text, keine Fake-Buchstaben, kein Wasserzeichen.</li>
              <li>Figur/Location muss klar wiedererkennbar sein.</li>
              <li>Stil muss gritty adult cartoon bleiben, nicht Anime/Pixar/Influencer.</li>
              <li>Nur approved_reference darf später in Dataset/LoRA wandern.</li>
            </ul>
          </section>

          {selectedPack.assets.map((asset) => {
            const review = getReferenceAssetReview(reviewState, selectedPack, asset);
            const expectedPath = expectedReferenceAssetPath(selectedPack, asset);

            return (
              <article className="card prompt-card" key={asset.id}>
                <div className="card-header">
                  <div>
                    <p className="eyebrow">{packTypeLabel(selectedPack.type)} Asset</p>
                    <h3>{asset.label}</h3>
                  </div>
                  <span className={`status-badge ${referenceStatusClass(review.status)}`}>{review.status}</span>
                </div>

                <div className="shot-meta">
                  <span>{asset.fileName}</span>
                  <span>{selectedPack.folder}</span>
                </div>

                <div className="dialogue-box">
                  <p className="eyebrow">Purpose</p>
                  <p>{asset.purpose}</p>
                </div>

                <div className="grid two-col">
                  <div>
                    <label>Review Status</label>
                    <select value={review.status} onChange={(event) => updateAssetReview(selectedPack, asset, { status: event.target.value as ReferenceReviewStatus })}>
                      {REFERENCE_REVIEW_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>

                  <div>
                    <label>Expected File Path</label>
                    <input readOnly value={expectedPath} />
                  </div>
                </div>

                <div>
                  <label>Actual Image Path optional</label>
                  <input
                    value={review.imagePath}
                    onChange={(event) => updateAssetReview(selectedPack, asset, { imagePath: event.target.value })}
                    placeholder={expectedPath}
                  />
                </div>

                <div>
                  <label>Review Notes</label>
                  <textarea
                    value={review.notes}
                    onChange={(event) => updateAssetReview(selectedPack, asset, { notes: event.target.value })}
                    placeholder="Was stimmt? Was driftet? Warum approved oder rejected?"
                  />
                </div>

                <label>Prompt</label>
                <textarea readOnly value={asset.prompt} />

                <div className="review-actions">
                  <button className="ghost-button" onClick={() => copyText(asset.prompt, `${asset.label} Prompt kopiert`)}>Prompt kopieren</button>
                  <button className="ghost-button" onClick={() => copyText(expectedPath, `${asset.fileName} Pfad kopiert`)}>Dateipfad kopieren</button>
                  <button className="ghost-button" onClick={() => updateAssetReview(selectedPack, asset, { imagePath: expectedPath })}>Pfad übernehmen</button>
                  <button className="ghost-button" onClick={() => updateAssetReview(selectedPack, asset, { status: 'approved_reference' })}>Approve</button>
                  <button className="ghost-button" onClick={() => updateAssetReview(selectedPack, asset, { status: 'needs_redraw' })}>Needs Redraw</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
