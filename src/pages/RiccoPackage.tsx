import { useEffect, useMemo, useState } from 'react';
import {
  buildAllRiccoPanelPrompts,
  riccoCharacters,
  riccoEpisode,
  riccoLocations,
  riccoPanels,
  riccoSeries
} from '../data/riccoStudio';
import { readLocalGenerationJobs } from '../lib/backend/localProductionStore';
import type { GenerationJob } from '../types/productionBackend';

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

const STORAGE_KEY = 'ricco-studio-images-v1';

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
}

function buildFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `ricco-im-haus-episode-001-package-${date}.json`;
}

export function RiccoPackage() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
  }, []);

  const packageData = useMemo(() => {
    const prompts = buildAllRiccoPanelPrompts();
    const promptsByPanelId = new Map(prompts.map((prompt) => [prompt.panelId, prompt]));
    const finalImagesByPanelId = new Map(images.filter((image) => image.selected).map((image) => [image.panelId, image]));
    const jobsByPanelId = new Map<string, GenerationJob[]>();

    for (const job of generationJobs) {
      if (!job.panelId) continue;
      const jobs = jobsByPanelId.get(job.panelId) ?? [];
      jobs.push(job);
      jobsByPanelId.set(job.panelId, jobs);
    }

    const panels = riccoPanels.map((panel) => {
      const prompt = promptsByPanelId.get(panel.id);
      const finalImage = finalImagesByPanelId.get(panel.id) ?? null;
      const panelJobs = jobsByPanelId.get(panel.id) ?? [];

      return {
        ...panel,
        prompt,
        generationJobs: panelJobs,
        finalImage,
        exportReady: Boolean(finalImage),
        productionNotes: finalImage?.notes ?? ''
      };
    });

    const finalCount = panels.filter((panel) => panel.exportReady).length;
    const importedJobCount = generationJobs.filter((job) => job.status === 'imported_as_asset').length;

    return {
      packageVersion: 'ricco-production-package-v2',
      generatedAt: new Date().toISOString(),
      appRoute: '#/ricco-package',
      series: riccoSeries,
      episode: riccoEpisode,
      characters: riccoCharacters,
      locations: riccoLocations,
      panels,
      generationState: {
        generationJobs,
        totalJobs: generationJobs.length,
        importedJobCount
      },
      reviewState: {
        storedImages: images,
        finalImageCount: finalCount,
        totalPanels: riccoPanels.length,
        exportReady: finalCount === riccoPanels.length
      },
      nextSteps: finalCount === riccoPanels.length
        ? ['Open Ricco Lettering Preview', 'Check dialogue layout', 'Use Browser Print / PDF']
        : generationJobs.length === 0
          ? ['Open Ricco Generation Queue', 'Create render jobs from prompt queue', 'Render and import panel images']
          : ['Open Ricco Image Review', 'Add missing generated images', 'Select exactly one final image per panel']
    };
  }, [images, generationJobs]);

  const packageJson = useMemo(() => JSON.stringify(packageData, null, 2), [packageData]);
  const finalCount = packageData.reviewState.finalImageCount;
  const isReady = packageData.reviewState.exportReady;

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
    anchor.download = buildFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function refreshPackageState() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setCopyStatus('Package State neu geladen');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className={isReady ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco Production Package v0.2</p>
        <h2>{isReady ? 'Package vollständig' : 'Package mit fehlenden Finalbildern'}</h2>
        <p className="body-copy">
          Exportiert den aktuellen Produktionsstand als JSON: Bible-Daten, Panels, Prompts, Generation Jobs, Dialoge, Review-Notizen und Finalbild-URLs.
        </p>
        <div className="chips">
          <span>{finalCount}/{riccoPanels.length} Finalbilder</span>
          <span>{packageData.generationState.totalJobs} Generation Jobs</span>
          <span>{packageData.generationState.importedJobCount} importiert</span>
          <span>{packageData.panels.length} Panels</span>
          <span>{packageData.characters.length} Characters</span>
          <span>{packageData.locations.length} Locations</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <button className="ghost-button" onClick={copyPackage}>JSON kopieren</button>
          <button className="primary-button" onClick={downloadPackage}>JSON herunterladen</button>
          <button className="ghost-button" onClick={refreshPackageState}>Neu laden</button>
          <a className="ghost-link" href="#/ricco-generation-queue">Generation Queue öffnen</a>
          <a className="ghost-link" href="#/ricco-lettering">Lettering öffnen</a>
        </div>
      </div>

      <div className="grid two-col">
        <section className="card rule-card">
          <p className="eyebrow">Inhalt</p>
          <h3>Was im Package steckt</h3>
          <ul>
            <li>Series Bible und Master Prompts</li>
            <li>Character- und Location-Daten</li>
            <li>Alle 8 Panels mit Action, Kamera, Mood und Dialog</li>
            <li>Positive und Negative Prompts pro Panel</li>
            <li>Generation Jobs inklusive Seed, Status, Settings und Output-Pfad</li>
            <li>Alle gespeicherten Bildvarianten aus LocalStorage</li>
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
