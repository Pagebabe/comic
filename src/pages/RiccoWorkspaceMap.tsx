import { useEffect, useMemo, useState } from 'react';
import {
  buildRiccoPipelineMap,
  pipelineStatusClass,
  pipelineStatusLabel
} from '../domain/workspace/riccoPipelineMap';
import {
  normalizeRiccoLetteringLayoutState,
  RICCO_LETTERING_STORAGE_KEY,
  type RiccoLetteringLayoutState
} from '../domain/lettering/riccoLetteringLayout';
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

function readLetteringLayout(): RiccoLetteringLayoutState {
  try {
    const raw = window.localStorage.getItem(RICCO_LETTERING_STORAGE_KEY);
    return normalizeRiccoLetteringLayoutState(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeRiccoLetteringLayoutState({});
  }
}

export function RiccoWorkspaceMap() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [referenceReviewState, setReferenceReviewState] = useState<ReferenceReviewState>({});
  const [letteringLayoutState, setLetteringLayoutState] = useState<RiccoLetteringLayoutState>(() => normalizeRiccoLetteringLayoutState({}));
  const [status, setStatus] = useState('');

  function refresh() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setReferenceReviewState(readReferenceReviewStorage());
    setLetteringLayoutState(readLetteringLayout());
    setStatus('Workspace Map neu geladen');
    window.setTimeout(() => setStatus(''), 1500);
  }

  useEffect(() => {
    refresh();
  }, []);

  const pipeline = useMemo(() => buildRiccoPipelineMap({
    referenceReviewState,
    generationJobs,
    images,
    letteringLayoutState
  }), [referenceReviewState, generationJobs, images, letteringLayoutState]);

  return (
    <section className="page-stack">
      <div className="hero-card">
        <p className="eyebrow">Ricco Workspace Map v0.1</p>
        <h2>Studio-Pipeline auf einen Blick</h2>
        <p className="body-copy">
          Diese Map zeigt, wo die Episode gerade steht: Story, References, Render Queue, Import, Review, QA, Lettering und Package. Jede Stage ist klickbar und führt direkt zum Arbeitsbereich.
        </p>
        <div className="chips">
          <span>{pipeline.progress}% complete</span>
          <span>{pipeline.doneCount}/{pipeline.totalStages} done</span>
          <span>{pipeline.activeCount} active</span>
          <span>{pipeline.warningCount} needs work</span>
          <span>{pipeline.blockedCount} blocked</span>
          <span>Current: {pipeline.currentStage.label}</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={refresh}>Map neu laden</button>
          <a className="ghost-link" href={pipeline.currentStage.route}>Aktuelle Stage öffnen</a>
          <a className="ghost-link" href="#/ricco-control">Control Room</a>
          <a className="ghost-link" href="#/ricco-package">Package sichern</a>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Current Stage</p>
            <h3>{pipeline.currentStage.label}</h3>
          </div>
          <span className={`status-badge ${pipelineStatusClass(pipeline.currentStage.status)}`}>
            {pipelineStatusLabel(pipeline.currentStage.status)}
          </span>
        </div>
        <p className="body-copy">{pipeline.currentStage.nextAction}</p>
        <div className="review-actions">
          <a className="primary-button" href={pipeline.currentStage.route}>Öffnen</a>
        </div>
      </section>

      <div className="grid two-col">
        {pipeline.stages.map((stage, index) => (
          <article className="card" key={stage.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{index + 1}. {stage.department}</p>
                <h3>{stage.label}</h3>
              </div>
              <span className={`status-badge ${pipelineStatusClass(stage.status)}`}>
                {pipelineStatusLabel(stage.status)}
              </span>
            </div>
            <div className="chips">
              <span>{stage.metric}</span>
            </div>
            <p className="body-copy">{stage.nextAction}</p>
            <div className="review-actions">
              <a className="ghost-link" href={stage.route}>Stage öffnen</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
