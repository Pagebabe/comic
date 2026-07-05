import { useEffect, useMemo, useState } from 'react';
import { riccoPanels } from '../data/riccoStudio';
import {
  buildRiccoPackageFileName,
  buildRiccoProductionPackage
} from '../domain/package/riccoProductionPackage';
import {
  RICCO_IMAGES_STORAGE_KEY,
  readLocalGenerationJobs,
  readReferenceReviewStorage
} from '../lib/backend/localProductionStore';
import type { GenerationJob } from '../types/productionBackend';
import type { ReferenceReviewState } from '../types/riccoReferenceReview';
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

export function RiccoPackage() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [referenceReviewState, setReferenceReviewState] = useState<ReferenceReviewState>({});
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    refreshPackageState();
  }, []);

  const packageData = useMemo(() => {
    return buildRiccoProductionPackage({ images, generationJobs, referenceReviewState });
  }, [images, generationJobs, referenceReviewState]);

  const packageJson = useMemo(() => JSON.stringify(packageData, null, 2), [packageData]);
  const finalCount = packageData.reviewState.finalImageCount;
  const isReady = packageData.reviewState.exportReady;
  const referenceSummary = packageData.referenceState.referenceReviewSummary;

  async function copyPackage() {
    await navigator.clipboard.writeText(packageJson);
    setCopyStatus('Package JSON kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  function downloadPackage() {
    const blob = new Blob([packageJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = buildRiccoPackageFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function refreshPackageState() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setReferenceReviewState(readReferenceReviewStorage());
    setCopyStatus('Package State neu geladen');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className={isReady ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco Production Package v0.3</p>
        <h2>{isReady ? 'Package vollständig' : 'Package mit fehlenden Finalbildern'}</h2>
        <p className="body-copy">
          Exportiert den Produktionsstand als JSON: Storydaten, Panels, Prompts, Generation Jobs, Reference Review, Bildvarianten und Finalbilder.
        </p>
        <div className="chips">
          <span>{finalCount}/{riccoPanels.length} Finalbilder</span>
          <span>{packageData.generationState.totalJobs} Generation Jobs</span>
          <span>{packageData.generationState.importedJobCount} importiert</span>
          <span>{referenceSummary.approved} approved refs</span>
          <span>{referenceSummary.candidate} ref candidates</span>
          <span>{packageData.panels.length} Panels</span>
          <span>{packageData.characters.length} Characters</span>
          <span>{packageData.locations.length} Locations</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <button className="ghost-button" onClick={copyPackage}>JSON kopieren</button>
          <button className="primary-button" onClick={downloadPackage}>JSON herunterladen</button>
          <button className="ghost-button" onClick={refreshPackageState}>Neu laden</button>
          <a className="ghost-link" href="#/ricco-reference-packs">Reference Packs öffnen</a>
          <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue öffnen</a>
          <a className="ghost-link" href="#/ricco-lettering">Lettering öffnen</a>
        </div>
      </div>

      <div className="grid two-col">
        <section className="card rule-card">
          <p className="eyebrow">Inhalt</p>
          <h3>Was im Package steckt</h3>
          <ul>
            <li>Series-Daten und Master Prompts</li>
            <li>Character- und Location-Daten</li>
            <li>Alle Panels mit Action, Kamera, Mood und Dialog</li>
            <li>Positive und Negative Prompts pro Panel</li>
            <li>Generation Jobs inklusive Seed, Status, Settings und Output-Pfad</li>
            <li>Reference Review mit Status, Pfaden und Notizen</li>
            <li>Gespeicherte Bildvarianten aus LocalStorage</li>
            <li>Finalbild pro Panel inklusive Rating, Continuity und Notizen</li>
          </ul>
        </section>

        <section className="card rule-card">
          <p className="eyebrow">Status</p>
          <h3>{isReady ? 'Bereit zur Sicherung' : 'Noch nicht komplett'}</h3>
          <ul>
            {packageData.nextSteps.map((step) => <li key={step}>{step}</li>)}
          </ul>
        </section>
      </div>

      <section className="card prompt-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Raw JSON</p>
            <h3>Production Package</h3>
          </div>
          <button className="ghost-button" onClick={copyPackage}>Copy</button>
        </div>
        <textarea readOnly value={packageJson} style={{ minHeight: 520 }} />
      </section>
    </section>
  );
}
