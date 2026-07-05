import { useMemo, useState } from 'react';
import {
  extractGenerationJobsFromRiccoPackage,
  extractImagesFromRiccoPackage,
  extractLetteringLayoutStateFromRiccoPackage,
  extractReferenceReviewStateFromRiccoPackage,
  packageLooksLikeRiccoPackage,
  parseRiccoProductionPackage
} from '../domain/package/riccoProductionPackage';
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

    setStatus(`${extractedImages.length} Bilder, ${extractedGenerationJobs.length} Generation Jobs, ${referenceSummary.total} Reference Reviews und ${letteringLayoutCount} Lettering Layouts wiederhergestellt.`);
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
        <p className="eyebrow">Ricco Package Import v0.4</p>
        <h2>Production Package wiederherstellen</h2>
        <p className="body-copy">
          Füge ein vorher exportiertes Ricco Production Package JSON ein. Die Seite stellt Bildvarianten, Finalbild-Auswahl, Generation Queue, Reference-Pack-Review und Lettering Layout im Browser wieder her.
        </p>
        <div className="chips">
          <span>{packageLooksValid ? 'Package erkannt' : 'kein Package erkannt'}</span>
          <span>{extractedImages.length} Bilder gefunden</span>
          <span>{extractedGenerationJobs.length} Generation Jobs</span>
          <span>{referenceSummary.total} Reference Reviews</span>
          <span>{referenceSummary.approved} approved refs</span>
          <span>{letteringLayoutCount} Lettering Layouts</span>
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
          <a className="ghost-link" href="#/ricco-reference-packs">Reference Packs öffnen</a>
          <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue öffnen</a>
          <a className="ghost-link" href="#/ricco-image-review">Review öffnen</a>
        </div>
      </div>

      <div className="grid two-col">
        <section className="card rule-card">
          <p className="eyebrow">So nutzt du es</p>
          <h3>Restore-Workflow</h3>
          <ul>
            <li>Auf Ricco Package JSON kopieren oder herunterladen.</li>
            <li>JSON hier einfügen.</li>
            <li>Alles wiederherstellen klicken.</li>
            <li>Danach Ricco Control, Workspace Map, Reference Packs, Generation Queue, Image Review, Export oder Lettering öffnen.</li>
          </ul>
        </section>

        <section className="card rule-card">
          <p className="eyebrow">Wichtig</p>
          <h3>Was wiederhergestellt wird</h3>
          <ul>
            <li>Bildvarianten aus dem Package.</li>
            <li>Finalbild-Auswahl pro Panel.</li>
            <li>Rating, Continuity und Notizen.</li>
            <li>Generation Jobs mit Seed, Settings, Status und Output-Pfad.</li>
            <li>Reference-Pack-Review mit Status, Pfaden und Notizen.</li>
            <li>Lettering Layout mit Bubble-Text, Position, Breite und Font.</li>
            <li>Story-, Character- und Panel-Daten bleiben aus dem Code-Seed.</li>
          </ul>
        </section>
      </div>

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
