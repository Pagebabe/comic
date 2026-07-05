import { useEffect, useMemo, useState } from 'react';
import { riccoCharacters, riccoEpisode, riccoPanels, riccoSeries } from '../data/riccoStudio';
import {
  estimateStorageBytes,
  readLocalGenerationJobs,
  readReferenceReviewStorage,
  RICCO_IMAGES_STORAGE_KEY
} from '../lib/backend/localProductionStore';
import { summarizeReferenceReviewState, type ReferenceReviewState } from '../types/riccoReferenceReview';
import type { RiccoPanelImage } from '../types/riccoReview';

type StepStatus = 'done' | 'active' | 'blocked';

type ProductionStep = {
  title: string;
  route: string;
  status: StepStatus;
  note: string;
};

const MIN_RATING = 4;
const MIN_CONTINUITY = 4;
const STORAGE_WARNING_BYTES = 3_500_000;
const MIN_APPROVED_REFERENCES_FOR_PILOT = 4;

function readRawStorage() {
  try {
    return window.localStorage.getItem(RICCO_IMAGES_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = readRawStorage();
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
}

function referenceStepStatus(approved: number, total: number): StepStatus {
  if (approved >= MIN_APPROVED_REFERENCES_FOR_PILOT) return 'done';
  if (total > 0) return 'active';
  return 'blocked';
}

function statusClass(status: StepStatus) {
  if (status === 'done') return 'status-active';
  if (status === 'blocked') return 'status-rejected';
  return 'status-needs_fix';
}

function statusLabel(status: StepStatus) {
  if (status === 'done') return 'done';
  if (status === 'blocked') return 'blocked';
  return 'active';
}

export function RiccoControlRoom() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [storageBytes, setStorageBytes] = useState(0);
  const [generationJobCount, setGenerationJobCount] = useState(0);
  const [referenceReviewState, setReferenceReviewState] = useState<ReferenceReviewState>({});
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
    setGenerationJobCount(readLocalGenerationJobs().length);
    setReferenceReviewState(readReferenceReviewStorage());
    setStorageBytes(estimateStorageBytes());
  }, []);

  const report = useMemo(() => {
    const finalImages = images.filter((image) => image.selected);
    const finalImagesByPanelId = new Map(finalImages.map((image) => [image.panelId, image]));
    const finalPanelCount = riccoPanels.filter((panel) => finalImagesByPanelId.has(panel.id)).length;
    const missingFinals = riccoPanels.length - finalPanelCount;
    const lowRating = finalImages.filter((image) => (image.rating || 0) < MIN_RATING).length;
    const lowContinuity = finalImages.filter((image) => (image.continuityScore || 0) < MIN_CONTINUITY).length;
    const missingNotes = finalImages.filter((image) => !image.notes.trim()).length;
    const gateIssues = missingFinals + lowRating + lowContinuity + missingNotes;
    const progress = Math.round((finalPanelCount / riccoPanels.length) * 100);
    const storageWarning = storageBytes > STORAGE_WARNING_BYTES;
    const references = summarizeReferenceReviewState(referenceReviewState);
    const referencesStatus = referenceStepStatus(references.approved, references.total);

    const steps: ProductionStep[] = [
      {
        title: 'Prompt Workbench',
        route: '#/ricco-studio',
        status: 'done',
        note: `${riccoPanels.length} Panels sind im Seed vorbereitet.`
      },
      {
        title: 'Prompt Queue',
        route: '#/ricco-prompt-queue',
        status: 'active',
        note: 'Alle Panel-Prompts als JSON, TXT oder CSV für externe Bildgenerierung exportieren.'
      },
      {
        title: 'Generation Queue',
        route: '#/ricco-generation-queue',
        status: generationJobCount > 0 ? 'done' : 'active',
        note: generationJobCount > 0
          ? `${generationJobCount} Render-Jobs sind für manuelle/API-fähige ComfyUI-Produktion vorbereitet.`
          : 'Prompt Queue in nachvollziehbare Render-Jobs mit Seed, Settings und Output-Pfad übersetzen.'
      },
      {
        title: 'ComfyUI M1 Renderplan',
        route: '#/ricco-comfy-m1',
        status: 'active',
        note: 'Lokale SDXL Settings, Dateinamen und Render-Checkliste prüfen.'
      },
      {
        title: 'Reference Packs',
        route: '#/ricco-reference-packs',
        status: referencesStatus,
        note: references.approved >= MIN_APPROVED_REFERENCES_FOR_PILOT
          ? `${references.approved} approved references. Genug Basis für erste Pilot-Tests.`
          : `${references.approved}/${MIN_APPROVED_REFERENCES_FOR_PILOT} approved references. Candidates: ${references.candidate}, Redraw: ${references.needsRedraw}, Rejected: ${references.rejected}.`
      },
      {
        title: 'Asset Import',
        route: '#/ricco-asset-import',
        status: 'active',
        note: 'Empfohlen: Bilder in public/generated/ legen und nur Pfade importieren, statt Base64 zu speichern.'
      },
      {
        title: 'Bulk Upload',
        route: '#/ricco-bulk-upload',
        status: 'active',
        note: 'Alternative: mehrere lokale Bilder als Browser-Uploads speichern und per Dateiname Panels zuordnen.'
      },
      {
        title: 'Image Review',
        route: '#/ricco-image-review',
        status: images.length > 0 ? 'done' : 'active',
        note: `${images.length} Bildvarianten gespeichert.`
      },
      {
        title: 'Storage Manager',
        route: '#/ricco-storage',
        status: storageWarning ? 'active' : 'done',
        note: storageWarning ? 'Browser-Speicher prüfen und nicht-finale Varianten aufräumen.' : 'Browser-Speicher ist im grünen Bereich.'
      },
      {
        title: 'Review Gate',
        route: '#/ricco-qa',
        status: gateIssues === 0 ? 'done' : missingFinals > 0 ? 'blocked' : 'active',
        note: `${gateIssues} offene Punkte: ${missingFinals} fehlende Finals, ${lowRating} Rating, ${lowContinuity} Continuity, ${missingNotes} Notizen.`
      },
      {
        title: 'Export Gate',
        route: '#/ricco-export',
        status: missingFinals === 0 ? 'done' : 'blocked',
        note: `${finalPanelCount}/${riccoPanels.length} Panels haben ein Finalbild.`
      },
      {
        title: 'Lettering Preview',
        route: '#/ricco-lettering',
        status: missingFinals === 0 ? 'active' : 'blocked',
        note: missingFinals === 0 ? 'Comic-Vorschau kann geprüft werden.' : 'Erst alle Finalbilder wählen.'
      },
      {
        title: 'Package Backup',
        route: '#/ricco-package',
        status: images.length > 0 || references.total > 0 ? 'active' : 'blocked',
        note: images.length > 0 || references.total > 0 ? 'Produktionsstand als JSON sichern.' : 'Erst Review-Bilder oder References speichern.'
      },
      {
        title: 'Restore Backup',
        route: '#/ricco-restore',
        status: 'active',
        note: 'Gesichertes JSON kann wieder eingespielt werden.'
      }
    ];

    const nextStep = steps.find((step) => step.status !== 'done') ?? steps[steps.length - 1];

    return {
      finalPanelCount,
      missingFinals,
      lowRating,
      lowContinuity,
      missingNotes,
      gateIssues,
      progress,
      storageWarning,
      references,
      referencesStatus,
      steps,
      nextStep
    };
  }, [images, storageBytes, generationJobCount, referenceReviewState]);

  function refreshState() {
    setImages(readStoredImages());
    setGenerationJobCount(readLocalGenerationJobs().length);
    setReferenceReviewState(readReferenceReviewStorage());
    setStorageBytes(estimateStorageBytes());
    setCopyStatus('Neu geladen');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function copyRunbook() {
    const lines = [
      `Ricco Control Room — ${riccoSeries.title}`,
      `Episode ${riccoEpisode.episodeNumber}: ${riccoEpisode.title}`,
      `Progress: ${report.progress}%`,
      `Finalbilder: ${report.finalPanelCount}/${riccoPanels.length}`,
      `Generation Jobs: ${generationJobCount}`,
      `Reference approved: ${report.references.approved}`,
      `Reference candidates: ${report.references.candidate}`,
      `Reference redraw: ${report.references.needsRedraw}`,
      `Reference rejected: ${report.references.rejected}`,
      `Offene Punkte: ${report.gateIssues}`,
      `Storage bytes: ${storageBytes}`,
      '',
      'Steps:',
      ...report.steps.map((step) => `- ${step.title}: ${statusLabel(step.status)} — ${step.note} (${step.route})`),
      '',
      `Next: ${report.nextStep.title} — ${report.nextStep.route}`
    ];

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopyStatus('Runbook kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className={report.gateIssues === 0 && !report.storageWarning ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco Control Room v0.2</p>
        <h2>{riccoSeries.title} · Folge {riccoEpisode.episodeNumber}: {riccoEpisode.title}</h2>
        <p className="body-copy">
          Ein zentraler Produktionsüberblick für Panels, Prompts, Generation Queue, M1 Renderplan, Reference Packs, Asset Import, Browser-Speicher, Finalbilder, Review-Gate, Lettering und Package-Backup.
        </p>
        <div className="chips">
          <span>{report.progress}% ready</span>
          <span>{report.finalPanelCount}/{riccoPanels.length} Finalbilder</span>
          <span>{generationJobCount} Generation Jobs</span>
          <span>{report.references.approved} approved refs</span>
          <span>{report.references.candidate} ref candidates</span>
          <span>{images.length} Bildvarianten</span>
          <span>{report.gateIssues} offene Punkte</span>
          <span>{Math.round(storageBytes / 1024)} KB Storage</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <a className="primary-button" href={report.nextStep.route}>Nächster Schritt: {report.nextStep.title}</a>
          <a className="ghost-link" href="#/ricco-reference-packs">Reference Packs öffnen</a>
          <button className="ghost-button" onClick={refreshState}>Status neu laden</button>
          <button className="ghost-button" onClick={copyRunbook}>Runbook kopieren</button>
        </div>
      </div>

      <div className="grid four-col">
        <div className="card">
          <p className="eyebrow">Characters</p>
          <h3>{riccoCharacters.length}</h3>
          <p className="body-copy">Figurenbasis für die Serie.</p>
        </div>
        <div className="card">
          <p className="eyebrow">References</p>
          <h3>{report.references.approved}</h3>
          <p className="body-copy">Approved references. Ziel Pilot-Test: {MIN_APPROVED_REFERENCES_FOR_PILOT}.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Jobs</p>
          <h3>{generationJobCount}</h3>
          <p className="body-copy">Render-Jobs für ComfyUI manuell/API-ready.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Gate</p>
          <h3>{report.gateIssues === 0 ? 'clear' : report.gateIssues}</h3>
          <p className="body-copy">Fehlende Finals, Rating, Continuity oder Notizen.</p>
        </div>
      </div>

      <section className="card rule-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Reference Pack Status</p>
            <h3>{report.references.approved}/{MIN_APPROVED_REFERENCES_FOR_PILOT} approved für ersten Pilot-Test</h3>
          </div>
          <span className={`status-badge ${statusClass(report.referencesStatus)}`}>{statusLabel(report.referencesStatus)}</span>
        </div>
        <div className="chips">
          <span>{report.references.total} reviewed</span>
          <span>{report.references.approved} approved</span>
          <span>{report.references.candidate} candidates</span>
          <span>{report.references.needsRedraw} redraw</span>
          <span>{report.references.rejected} rejected</span>
        </div>
        <p className="body-copy">
          Für echte Serienkonstanz zuerst Ricco- und Style-Referenzen approven. Danach erst Panel-Batch, LoRA oder API-Automation ernsthaft hochziehen.
        </p>
        <div className="review-actions">
          <a className="primary-button" href="#/ricco-reference-packs">Reference Packs bearbeiten</a>
        </div>
      </section>

      <section className="page-stack compact-stack">
        <div className="section-header">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2>Produktionsschritte</h2>
          </div>
          <a className="ghost-link" href="#/ricco-package">Package sichern</a>
        </div>

        {report.steps.map((step) => (
          <article className="card" key={step.title}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{step.route}</p>
                <h3>{step.title}</h3>
              </div>
              <span className={`status-badge ${statusClass(step.status)}`}>{statusLabel(step.status)}</span>
            </div>
            <p className="body-copy">{step.note}</p>
            <div className="review-actions">
              <a className="ghost-link" href={step.route}>öffnen</a>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
