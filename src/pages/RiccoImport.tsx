import { useMemo, useState } from 'react';
import {
  extractGenerationJobsFromRiccoPackage,
  extractImagesFromRiccoPackage,
  extractLetteringLayoutStateFromRiccoPackage,
  extractReferenceReviewStateFromRiccoPackage,
  packageLooksLikeRiccoPackage,
  parseRiccoProductionPackage
} from '../domain/package/riccoProductionPackage';
import {
  buildRiccoRestorePreview,
  buildRiccoRestoreStatusText
} from '../domain/package/riccoRestorePreview';
import { RICCO_LETTERING_STORAGE_KEY } from '../domain/lettering/riccoLetteringLayout';
import {
  RICCO_GENERATION_JOBS_STORAGE_KEY,
  RICCO_IMAGES_STORAGE_KEY,
  RICCO_REFERENCE_REVIEW_STORAGE_KEY
} from '../lib/backend/localProductionStore';
import { summarizeReferenceReviewState } from '../types/riccoReferenceReview';

export function RiccoImport() {
  const [rawJson, setRawJson] = useState('');
  const [status, setStatus] = useState('');

  const parsedPackage = useMemo(() => parseRiccoProductionPackage(rawJson), [rawJson]);
  const extractedImages = useMemo(() => (parsedPackage ? extractImagesFromRiccoPackage(parsedPackage) : []), [parsedPackage]);
  const extractedGenerationJobs = useMemo(() => (parsedPackage ? extractGenerationJobsFromRiccoPackage(parsedPackage) : []), [parsedPackage]);
  const extractedReferenceReviewState = useMemo(() => (parsedPackage ? extractReferenceReviewStateFromRiccoPackage(parsedPackage) : {}), [parsedPackage]);
  const extractedLetteringLayoutState = useMemo(() => (parsedPackage ? extractLetteringLayoutStateFromRiccoPackage(parsedPackage) : {}), [parsedPackage]);
  const referenceSummary = useMemo(() => summarizeReferenceReviewState(extractedReferenceReviewState), [extractedReferenceReviewState]);
  const restorePreview = useMemo(() => buildRiccoRestorePreview(parsedPackage), [parsedPackage]);
  const finalCount = extractedImages.filter((image) => image.selected).length;
  const letteringLayoutCount = Object.keys(extractedLetteringLayoutState).length;
  const packageLooksValid = packageLooksLikeRiccoPackage(parsedPackage);

  function restoreImages() {
    if (!parsedPackage || extractedImages.length === 0) {
      setStatus('Kein gültiges Package oder keine Bilder gefunden.');
      return;
    }

    window.localStorage.setItem(RICCO_IMAGES_STORAGE_KEY, JSON.stringify(extractedImages));
    setStatus(`${extractedImages.length} Bilder wiederhergestellt. ${finalCount} Finalbilder gesetzt.`);
  }

  function restoreGenerationJobs() {
    if (!parsedPackage || extractedGenerationJobs.length === 0) {
      setStatus('Kein gültiges Package oder keine Generation Jobs gefunden.');
      return;
    }

    window.localStorage.setItem(RICCO_GENERATION_JOBS_STORAGE_KEY, JSON.stringify(extractedGenerationJobs, null, 2));
    setStatus(`${extractedGenerationJobs.length} Generation Jobs wiederhergestellt.`);
  }

  function restoreReferenceReview() {
    if (!parsedPackage || referenceSummary.total === 0) {
      setStatus('Kein gültiges Package oder kein Reference Review gefunden.');
      return;
    }

    window.localStorage.setItem(RICCO_REFERENCE_REVIEW_STORAGE_KEY, JSON.stringify(extractedReferenceReviewState));
    setStatus(`${referenceSummary.total} Reference Reviews wiederhergestellt. ${referenceSummary.approved} approved.`);
  }

  function restoreLetteringLayout() {
    if (!parsedPackage || letteringLayoutCount === 0) {
      setStatus('Kein gültiges Package oder kein Lettering Layout gefunden.');
      return;
    }

    window.localStorage.setItem(RICCO_LETTERING_STORAGE_KEY, JSON.stringify(extractedLetteringLayoutState));
    setStatus(`${letteringLayoutCount} Lettering Layouts wiederhergestellt.`);
  }

  function restoreFullPackage() {
    if (!parsedPackage) {
      setStatus('Kein gültiges Package erkannt.');
      return;
    }

    if (extractedImages.length > 0) {
      window.localStorage.setItem(RICCO_IMAGES_STORAGE_KEY, JSON.stringify(extractedImages));
    }

    if (extractedGenerationJobs.length > 0) {
      window.localStorage.setItem(RICCO_GENERATION_JOBS_STORAGE_KEY, JSON.stringify(extractedGenerationJobs, null, 2));
    }

    if (referenceSummary.total > 0) {
      window.localStorage.setItem(RICCO_REFERENCE_REVIEW_STORAGE_KEY, JSON.stringify(extractedReferenceReviewState));
    }

    if (letteringLayoutCount > 0) {
      window.localStorage.setItem(RICCO_LETTERING_STORAGE_KEY, JSON.stringify(extractedLetteringLayoutState));
    }

    setStatus(`Wiederhergestellt: ${buildRiccoRestoreStatusText(restorePreview)}.`);
  }

  function clearInput() {
    setRawJson('');
    setStatus('');
  }

  function clearLocalReview() {
    const ok = window.confirm('Aktuellen Ricco Image Review Stand aus dem Browser löschen?');
    if (!ok) return;

    window.localStorage.removeItem(RICCO_IMAGES_STORAGE_KEY);
    setStatus('Lokaler Review-Stand gelöscht.');
  }

  function clearLocalGenerationJobs() {
    const ok = window.confirm('Aktuelle Ricco Generation Queue aus dem Browser löschen?');
    if (!ok) return;

    window.localStorage.removeItem(RICCO_GENERATION_JOBS_STORAGE_KEY);
    setStatus('Lokale Generation Queue gelöscht.');
  }

  function clearLocalReferenceReview() {
    const ok = window.confirm('Aktuellen Reference-Pack-Review-Stand aus dem Browser löschen?');
    if (!ok) return;

    window.localStorage.removeItem(RICCO_REFERENCE_REVIEW_STORAGE_KEY);
    setStatus('Lokaler Reference Review gelöscht.');
  }

  function clearLocalLetteringLayout() {
    const ok = window.confirm('Aktuelles Ricco Lettering Layout aus dem Browser löschen?');
    if (!ok) return;

    window.localStorage.removeItem(RICCO_LETTERING_STORAGE_KEY);
    setStatus('Lokales Lettering Layout gelöscht.');
  }

  return (
    <section className="page-stack">
      <div className={packageLooksValid ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco Package Import v0.6</p>
        <h2>Production Package wiederherstellen</h2>
        <p className="body-copy">
          Füge ein vorher exportiertes Ricco Production Package JSON ein. Die Seite stellt Bildvarianten, Finalbild-Auswahl, Asset-Status, Candidate-Metadaten, Dataset-Metadaten, Generation Queue, Reference-Pack-Review und Lettering Layout im Browser wieder her. LoRA- und Pipeline-Snapshots werden als Archivstatus angezeigt und nach Restore aus den Bilddaten wieder berechnet.
        </p>
        <div className="chips">
          <span>{packageLooksValid ? 'Package erkannt' : 'kein Package erkannt'}</span>
          <span>{restorePreview.packageVersion || 'no version'}</span>
          <span>{extractedImages.length} Bilder gefunden</span>
          <span>{extractedGenerationJobs.length} Generation Jobs</span>
          <span>{referenceSummary.total} Reference Reviews</span>
          <span>{referenceSummary.approved} approved refs</span>
          <span>{letteringLayoutCount} Lettering Layouts</span>
          <span>{restorePreview.assetMetadataImageCount} asset metadata</span>
          <span>{restorePreview.referenceCandidateMetadataImageCount} ref metadata</span>
          <span>{restorePreview.datasetMetadataImageCount} dataset metadata</span>
          <span>{restorePreview.datasetCandidateImageCount} dataset_candidate</span>
          <span>{restorePreview.approvedDatasetImageCount} approved_dataset</span>
          <span>{restorePreview.needsFixImageCount} needs_fix</span>
          <span>{restorePreview.loraReadyTargets} LoRA ready</span>
          <span>{restorePreview.loraNeedsWorkTargets} LoRA needs work</span>
          <span>{parsedPackage?.pipelineState?.progress ?? 0}% pipeline</span>
          <span>{finalCount} Finalbilder</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={restoreFullPackage}>Alles wiederherstellen</button>
          <button className="ghost-button" onClick={restoreImages}>Nur Bilder</button>
          <button className="ghost-button" onClick={restoreGenerationJobs}>Nur Generation Jobs</button>
          <button className="ghost-button" onClick={restoreReferenceReview}>Nur Reference Review</button>
          <button className="ghost-button" onClick={restoreLetteringLayout}>Nur Lettering</button>
          <button className="ghost-button" onClick={clearInput}>Input leeren</button>
          <button className="ghost-button" onClick={clearLocalReview}>Local Review löschen</button>
          <button className="ghost-button" onClick={clearLocalGenerationJobs}>Local Jobs löschen</button>
          <button className="ghost-button" onClick={clearLocalReferenceReview}>Local References löschen</button>
          <button className="ghost-button" onClick={clearLocalLetteringLayout}>Local Lettering löschen</button>
          <a className="ghost-link" href="#/ricco-workspace">Workspace Map öffnen</a>
          <a className="ghost-link" href="#/ricco-assets">Asset Library öffnen</a>
          <a className="ghost-link" href="#/ricco-approved-dataset">Approved Dataset öffnen</a>
          <a className="ghost-link" href="#/ricco-lora-training-plan">LoRA Plan öffnen</a>
          <a className="ghost-link" href="#/ricco-reference-packs">Reference Packs öffnen</a>
          <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue öffnen</a>
          <a className="ghost-link" href="#/ricco-image-review">Review öffnen</a>
        </div>
      </div>

      <div className="grid two-col">
        <section className="card rule-card">
          <p className="eyebrow">Restore Preview</p>
          <h3>{packageLooksValid ? 'Archivstatus erkannt' : 'Noch kein gültiges Package'}</h3>
          <ul>
            <li>{restorePreview.imageCount} Bilder, davon {restorePreview.finalImageCount} Finalbilder.</li>
            <li>{restorePreview.assetMetadataImageCount} Bilder mit Asset-Status.</li>
            <li>{restorePreview.referenceCandidateMetadataImageCount} Bilder mit Reference-Candidate-Metadaten.</li>
            <li>{restorePreview.datasetMetadataImageCount} Bilder mit Dataset-Metadaten.</li>
            <li>{restorePreview.datasetCandidateImageCount} Dataset Candidates und {restorePreview.approvedDatasetImageCount} Approved Dataset Assets.</li>
            <li>{restorePreview.loraSnapshotPresent ? 'LoRA Plan Snapshot im Archiv vorhanden.' : 'Kein LoRA Plan Snapshot im Archiv.'}</li>
            <li>{restorePreview.loraReadyTargets} LoRA Targets ready, {restorePreview.loraNeedsWorkTargets} brauchen Arbeit.</li>
            <li>Pipeline Snapshot: {restorePreview.pipelineProgress}% · {restorePreview.currentStageLabel || 'keine Stage'}</li>
          </ul>
        </section>

        <section className="card rule-card">
          <p className="eyebrow">So nutzt du es</p>
          <h3>Restore-Workflow</h3>
          <ul>
            <li>Auf Ricco Package JSON kopieren oder herunterladen.</li>
            <li>JSON hier einfügen.</li>
            <li>Preview prüfen: Asset-Metadaten, Dataset-Metadaten und LoRA Snapshot.</li>
            <li>Alles wiederherstellen klicken.</li>
            <li>Danach Ricco Control, Workspace Map, Asset Library, Approved Dataset, LoRA Plan, Review oder Lettering öffnen.</li>
          </ul>
        </section>
      </div>

      <section className="card rule-card">
        <p className="eyebrow">Wichtig</p>
        <h3>Was wiederhergestellt wird</h3>
        <ul>
          <li>Bildvarianten aus dem Package.</li>
          <li>Finalbild-Auswahl pro Panel.</li>
          <li>Rating, Continuity und Notizen.</li>
          <li>Asset-Status, Fix Queue, Reference Candidate und Dataset Candidate Metadaten über die Bildobjekte.</li>
          <li>Generation Jobs mit Seed, Settings, Status und Output-Pfad.</li>
          <li>Reference-Pack-Review mit Status, Pfaden und Notizen.</li>
          <li>Lettering Layout mit Bubble-Text, Position, Breite und Font.</li>
          <li>LoRA Plan und Pipeline werden nach Restore aus Bildern, Jobs und Metadaten wieder sichtbar.</li>
          <li>Story-, Character- und Panel-Daten bleiben aus dem Code-Seed.</li>
        </ul>
      </section>

      <section className="card prompt-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Package JSON</p>
            <h3>Hier einfügen</h3>
          </div>
          <span className={`status-badge ${packageLooksValid ? 'status-active' : 'status-needs_fix'}`}>
            {packageLooksValid ? 'valid-ish' : 'waiting'}
          </span>
        </div>
        <textarea
          value={rawJson}
          onChange={(event) => setRawJson(event.target.value)}
          placeholder="Ricco Production Package JSON hier einfügen..."
          style={{ minHeight: 520 }}
        />
      </section>
    </section>
  );
}
