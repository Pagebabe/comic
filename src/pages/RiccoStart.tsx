import { useEffect, useMemo, useState } from 'react';
import { riccoEpisode, riccoPanels, riccoSeries } from '../data/riccoStudio';
import { readLocalGenerationJobs, RICCO_IMAGES_STORAGE_KEY } from '../lib/backend/localProductionStore';
import type { RiccoPanelImage } from '../types/riccoReview';

function readImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(RICCO_IMAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) as RiccoPanelImage[] : [];
  } catch {
    return [];
  }
}

function statusForPanel(panelId: string, images: RiccoPanelImage[]) {
  const panelImages = images.filter((image) => image.panelId === panelId);
  if (panelImages.some((image) => image.selected)) return 'FINAL';
  if (panelImages.length > 0) return 'REVIEW';
  return 'TODO';
}

function statusClass(status: string) {
  if (status === 'FINAL') return 'status-active';
  if (status === 'REVIEW') return 'status-needs_fix';
  return 'status-rejected';
}

export function RiccoStart() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [jobCount, setJobCount] = useState(0);

  function refresh() {
    setImages(readImages());
    setJobCount(readLocalGenerationJobs().length);
  }

  useEffect(() => {
    refresh();
  }, []);

  const report = useMemo(() => {
    const finalPanelIds = new Set(images.filter((image) => image.selected).map((image) => image.panelId));
    const firstMissing = riccoPanels.find((panel) => !finalPanelIds.has(panel.id)) ?? riccoPanels[0];
    const finalCount = finalPanelIds.size;

    if (images.length === 0) {
      return {
        finalCount,
        progress: Math.round((finalCount / riccoPanels.length) * 100),
        title: 'Make the first images',
        route: '#/ricco-prompt-queue',
        button: 'Make Images for Panel 1',
        helper: `Start with Panel ${firstMissing.panelNumber}: ${firstMissing.title}. Make 2-4 rough variants.`
      };
    }

    if (finalCount < riccoPanels.length) {
      return {
        finalCount,
        progress: Math.round((finalCount / riccoPanels.length) * 100),
        title: 'Choose final images',
        route: '#/ricco-image-review',
        button: `Choose Final for Panel ${firstMissing.panelNumber}`,
        helper: `Panel ${firstMissing.panelNumber}: ${firstMissing.title} still needs one final image.`
      };
    }

    return {
      finalCount,
      progress: 100,
      title: 'Add dialogue text',
      route: '#/ricco-lettering',
      button: 'Add Text',
      helper: 'All panels have final images. Add dialogue and prepare export.'
    };
  }, [images]);

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Start</p>
        <h2>{riccoSeries.title} · Folge {riccoEpisode.episodeNumber}: {riccoEpisode.title}</h2>
        <p className="body-copy">Begin here. The app shows the next step for finishing the rough episode.</p>
        <div className="chips">
          <span>{report.finalCount}/{riccoPanels.length} final images</span>
          <span>{report.progress}% done</span>
          <span>{images.length} image variants</span>
          <span>{jobCount} render jobs</span>
        </div>
      </div>

      <section className="card rule-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Next step</p>
            <h3>{report.title}</h3>
          </div>
          <span className="status-badge status-needs_fix">next</span>
        </div>
        <p className="body-copy">{report.helper}</p>
        <div className="review-actions">
          <a className="primary-button" href={report.route}>{report.button}</a>
          <button className="ghost-button" onClick={refresh}>Refresh</button>
        </div>
      </section>

      <section className="card rule-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Episode Board</p>
            <h3>Panel progress</h3>
          </div>
          <a className="ghost-link" href="#/ricco-studio">Open Episode Board</a>
        </div>
        <div className="grid four-col">
          {riccoPanels.map((panel) => {
            const status = statusForPanel(panel.id, images);
            return (
              <article className="card" key={panel.id}>
                <p className="eyebrow">Panel {panel.panelNumber}</p>
                <h3>{panel.title}</h3>
                <span className={`status-badge ${statusClass(status)}`}>{status}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card rule-card">
        <p className="eyebrow">Flow</p>
        <h3>Simple path</h3>
        <div className="chips">
          <span>Make Images</span>
          <span>Choose Images</span>
          <span>Add Text</span>
          <span>Export</span>
          <span>Save Backup</span>
        </div>
      </section>
    </section>
  );
}
