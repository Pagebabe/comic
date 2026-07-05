import { useMemo, useState } from 'react';
import { RICCO_GENERATION_JOBS_STORAGE_KEY } from '../lib/backend/localProductionStore';
import type { GenerationJob } from '../types/productionBackend';

const STORAGE_KEY = 'ricco-studio-images-v1';

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
  generationJobId?: string;
  promptId?: string;
};

type PackagePanel = {
  id: string;
  finalImage?: RiccoPanelImage | null;
  generationJobs?: GenerationJob[];
};

type RiccoProductionPackage = {
  packageVersion?: string;
  generatedAt?: string;
  panels?: PackagePanel[];
  generationState?: {
    generationJobs?: GenerationJob[];
    totalJobs?: number;
    importedJobCount?: number;
  };
  reviewState?: {
    storedImages?: RiccoPanelImage[];
    finalImageCount?: number;
    totalPanels?: number;
    exportReady?: boolean;
  };
};

function isPanelImage(value: unknown): value is RiccoPanelImage {
  if (!value || typeof value !== 'object') return false;
  const image = value as Partial<RiccoPanelImage>;

  return (
    typeof image.id === 'string' &&
    typeof image.panelId === 'string' &&
    typeof image.imageUrl === 'string' &&
    typeof image.source === 'string' &&
    typeof image.selected === 'boolean'
  );
}

function isGenerationJob(value: unknown): value is GenerationJob {
  if (!value || typeof value !== 'object') return false;
  const job = value as Partial<GenerationJob>;

  return (
    typeof job.id === 'string' &&
    typeof job.promptId === 'string' &&
    typeof job.workflowId === 'string' &&
    typeof job.positivePrompt === 'string' &&
    typeof job.negativePrompt === 'string' &&
    typeof job.status === 'string'
  );
}

function parsePackage(raw: string): RiccoProductionPackage | null {
  try {
    const parsed = JSON.parse(raw) as RiccoProductionPackage;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function extractImagesFromPackage(pkg: RiccoProductionPackage) {
  const storedImages = pkg.reviewState?.storedImages ?? [];
  const finalImagesFromPanels = (pkg.panels ?? [])
    .map((panel) => panel.finalImage)
    .filter(isPanelImage);

  const merged = new Map<string, RiccoPanelImage>();

  for (const image of storedImages) {
    if (isPanelImage(image)) {
      merged.set(image.id, image);
    }
  }

  for (const image of finalImagesFromPanels) {
    merged.set(image.id, image);
  }

  return Array.from(merged.values());
}

function extractGenerationJobsFromPackage(pkg: RiccoProductionPackage) {
  const directJobs = pkg.generationState?.generationJobs ?? [];
  const panelJobs = (pkg.panels ?? []).flatMap((panel) => panel.generationJobs ?? []);
  const merged = new Map<string, GenerationJob>();

  for (const job of directJobs) {
    if (isGenerationJob(job)) {
      merged.set(job.id, job);
    }
  }

  for (const job of panelJobs) {
    if (isGenerationJob(job)) {
      merged.set(job.id, job);
    }
  }

  return Array.from(merged.values());
}

export function RiccoImport() {
  const [rawJson, setRawJson] = useState('');
  const [status, setStatus] = useState('');

  const parsedPackage = useMemo(() => parsePackage(rawJson), [rawJson]);
  const extractedImages = useMemo(() => (parsedPackage ? extractImagesFromPackage(parsedPackage) : []), [parsedPackage]);
  const extractedGenerationJobs = useMemo(() => (parsedPackage ? extractGenerationJobsFromPackage(parsedPackage) : []), [parsedPackage]);
  const finalCount = extractedImages.filter((image) => image.selected).length;
  const packageLooksValid = Boolean(parsedPackage?.packageVersion || parsedPackage?.reviewState || parsedPackage?.panels || parsedPackage?.generationState);

  function restoreImages() {
    if (!parsedPackage || extractedImages.length === 0) {
      setStatus('Kein gültiges Package oder keine Bilder gefunden.');
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(extractedImages));
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

  function restoreFullPackage() {
    if (!parsedPackage) {
      setStatus('Kein gültiges Package erkannt.');
      return;
    }

    if (extractedImages.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(extractedImages));
    }

    if (extractedGenerationJobs.length > 0) {
      window.localStorage.setItem(RICCO_GENERATION_JOBS_STORAGE_KEY, JSON.stringify(extractedGenerationJobs, null, 2));
    }

    setStatus(`${extractedImages.length} Bilder und ${extractedGenerationJobs.length} Generation Jobs wiederhergestellt.`);
  }

  function clearInput() {
    setRawJson('');
    setStatus('');
  }

  function clearLocalReview() {
    const ok = window.confirm('Aktuellen Ricco Image Review Stand aus dem Browser löschen?');
    if (!ok) return;

    window.localStorage.removeItem(STORAGE_KEY);
    setStatus('Lokaler Review-Stand gelöscht.');
  }

  function clearLocalGenerationJobs() {
    const ok = window.confirm('Aktuelle Ricco Generation Queue aus dem Browser löschen?');
    if (!ok) return;

    window.localStorage.removeItem(RICCO_GENERATION_JOBS_STORAGE_KEY);
    setStatus('Lokale Generation Queue gelöscht.');
  }

  return (
    <section className="page-stack">
      <div className={packageLooksValid ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco Package Import v0.2</p>
        <h2>Production Package wiederherstellen</h2>
        <p className="body-copy">
          Füge ein vorher exportiertes Ricco Production Package JSON ein. Die Seite stellt Bildvarianten, Finalbild-Auswahl und Generation Queue im Browser wieder her.
        </p>
        <div className="chips">
          <span>{packageLooksValid ? 'Package erkannt' : 'kein Package erkannt'}</span>
          <span>{extractedImages.length} Bilder gefunden</span>
          <span>{extractedGenerationJobs.length} Generation Jobs</span>
          <span>{finalCount} Finalbilder</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={restoreFullPackage}>Alles wiederherstellen</button>
          <button className="ghost-button" onClick={restoreImages}>Nur Bilder</button>
          <button className="ghost-button" onClick={restoreGenerationJobs}>Nur Generation Jobs</button>
          <button className="ghost-button" onClick={clearInput}>Input leeren</button>
          <button className="ghost-button" onClick={clearLocalReview}>Local Review löschen</button>
          <button className="ghost-button" onClick={clearLocalGenerationJobs}>Local Jobs löschen</button>
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
            <li>Danach Ricco Generation Queue, Image Review, Export oder Lettering öffnen.</li>
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
