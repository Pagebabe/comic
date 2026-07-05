import { useEffect, useMemo, useState } from 'react';
import { riccoEpisode, riccoPanels, riccoSeries } from '../data/riccoStudio';
import {
  beginnerPanelStatusClass,
  buildBeginnerEpisodeReport,
  getBeginnerPanelStatus
} from '../domain/episode/riccoBeginnerFlow';
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

  const report = useMemo(() => buildBeginnerEpisodeReport(images), [images]);

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
            <h3>{report.nextAction.title}</h3>
          </div>
          <span className="status-badge status-needs_fix">next</span>
        </div>
        <p className="body-copy">{report.nextAction.helper}</p>
        <div className="review-actions">
          <a className="primary-button" href={report.nextAction.route}>{report.nextAction.button}</a>
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
            const status = getBeginnerPanelStatus(panel.id, images);
            return (
              <article className="card" key={panel.id}>
                <p className="eyebrow">Panel {panel.panelNumber}</p>
                <h3>{panel.title}</h3>
                <span className={`status-badge ${beginnerPanelStatusClass(status)}`}>{status}</span>
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
