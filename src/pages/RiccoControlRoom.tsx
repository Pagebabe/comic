import { useEffect, useMemo, useState } from 'react';
import { riccoCharacters, riccoEpisode, riccoLocations, riccoPanels, riccoSeries } from '../data/riccoStudio';

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

type StepStatus = 'done' | 'active' | 'blocked';

type ProductionStep = {
  title: string;
  route: string;
  status: StepStatus;
  note: string;
};

const STORAGE_KEY = 'ricco-studio-images-v1';
const MIN_RATING = 4;
const MIN_CONTINUITY = 4;

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
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
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
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
        title: 'Image Review',
        route: '#/ricco-image-review',
        status: images.length > 0 ? 'done' : 'active',
        note: `${images.length} Bildvarianten gespeichert.`
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
        status: images.length > 0 ? 'active' : 'blocked',
        note: images.length > 0 ? 'Produktionsstand als JSON sichern.' : 'Erst Review-Bilder speichern.'
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
      steps,
      nextStep
    };
  }, [images]);

  function refreshState() {
    setImages(readStoredImages());
    setCopyStatus('Neu geladen');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function copyRunbook() {
    const lines = [
      `Ricco Control Room — ${riccoSeries.title}`,
      `Episode ${riccoEpisode.episodeNumber}: ${riccoEpisode.title}`,
      `Progress: ${report.progress}%`,
      `Finalbilder: ${report.finalPanelCount}/${riccoPanels.length}`,
      `Offene Punkte: ${report.gateIssues}`,
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
      <div className={report.gateIssues === 0 ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco Control Room v0.1</p>
        <h2>{riccoSeries.title} · Folge {riccoEpisode.episodeNumber}: {riccoEpisode.title}</h2>
        <p className="body-copy">
          Ein zentraler Produktionsüberblick für Panels, Prompts, Bildvarianten, Finalbilder, Review-Gate, Lettering und Package-Backup.
        </p>
        <div className="chips">
          <span>{report.progress}% ready</span>
          <span>{report.finalPanelCount}/{riccoPanels.length} Finalbilder</span>
          <span>{images.length} Bildvarianten</span>
          <span>{report.gateIssues} offene Punkte</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <a className="primary-button" href={report.nextStep.route}>Nächster Schritt: {report.nextStep.title}</a>
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
          <p className="eyebrow">Locations</p>
          <h3>{riccoLocations.length}</h3>
          <p className="body-copy">Wiederkehrende Orte.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Panels</p>
          <h3>{riccoPanels.length}</h3>
          <p className="body-copy">Pilotfolge ist als Panelboard angelegt.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Gate</p>
          <h3>{report.gateIssues === 0 ? 'clear' : report.gateIssues}</h3>
          <p className="body-copy">Fehlende Finals, Rating, Continuity oder Notizen.</p>
        </div>
      </div>

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
