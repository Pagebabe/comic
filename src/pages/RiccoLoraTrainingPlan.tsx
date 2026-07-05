import { useEffect, useMemo, useState } from 'react';
import {
  buildLoraTrainingChecklist,
  buildLoraTrainingPlan,
  buildLoraTrainingPlanReport,
  readinessLabel,
  readinessStatusClass
} from '../domain/training/riccoLoraTrainingPlan';
import {
  RICCO_IMAGES_STORAGE_KEY,
  readLocalGenerationJobs
} from '../lib/backend/localProductionStore';
import type { GenerationJob } from '../types/productionBackend';
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

export function RiccoLoraTrainingPlan() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [status, setStatus] = useState('');

  function refresh() {
    setImages(readStoredImages());
    setGenerationJobs(readLocalGenerationJobs());
    setStatus('LoRA Training Plan neu geladen');
    window.setTimeout(() => setStatus(''), 1500);
  }

  useEffect(() => {
    refresh();
  }, []);

  const plan = useMemo(() => buildLoraTrainingPlan(images, generationJobs), [images, generationJobs]);
  const report = useMemo(() => buildLoraTrainingPlanReport(plan), [plan]);
  const planJson = useMemo(() => JSON.stringify(plan, null, 2), [plan]);

  async function copyReport() {
    await navigator.clipboard.writeText(report);
    setStatus('LoRA Readiness Report kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  async function copyJson() {
    await navigator.clipboard.writeText(planJson);
    setStatus('LoRA Plan JSON kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  async function copyChecklist(targetId: string) {
    const target = plan.targets.find((item) => item.targetId === targetId);
    if (!target) return;
    await navigator.clipboard.writeText(buildLoraTrainingChecklist(target));
    setStatus('Target Checklist kopiert');
    window.setTimeout(() => setStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className={plan.needsWorkTargets > 0 || plan.totalApprovedItems === 0 ? 'hero-card warning-card' : 'hero-card'}>
        <p className="eyebrow">Ricco LoRA Training Plan v0.2</p>
        <h2>{plan.targets.length > 0 ? `${plan.targets.length} LoRA Targets vorbereitet` : 'Noch keine LoRA Targets bereit'}</h2>
        <p className="body-copy">
          Kein Training wird gestartet. Diese Seite prüft nur, ob approved_dataset Assets für spätere LoRA-Trainings bereit sind: Ziel-LoRA, Trigger, Captions, Mindestanzahl Bilder und Exportpfade.
        </p>
        <div className="chips">
          <span>{plan.totalApprovedItems} approved items</span>
          <span>{plan.readyApprovedItems} ready items</span>
          <span>{plan.warningApprovedItems} warning items</span>
          <span>{plan.readyTargets} ready targets</span>
          <span>{plan.needsWorkTargets} targets need work</span>
          <span>{plan.approvedDatasetSummary.characterLora} character</span>
          <span>{plan.approvedDatasetSummary.locationLora} location</span>
          <span>{plan.approvedDatasetSummary.styleLora} style</span>
          {status && <span>{status}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={refresh}>Neu laden</button>
          <button className="ghost-button" onClick={copyReport}>Report kopieren</button>
          <button className="ghost-button" onClick={copyJson}>Plan JSON kopieren</button>
          <a className="ghost-link" href="#/ricco-approved-dataset">Approved Dataset</a>
          <a className="ghost-link" href="#/ricco-dataset-candidates">Dataset Candidates</a>
          <a className="ghost-link" href="#/ricco-assets">Asset Library</a>
        </div>
      </div>

      {plan.targets.length === 0 && (
        <div className="card">
          <p className="eyebrow">Leer</p>
          <h3>Keine approved_dataset Targets</h3>
          <p className="body-copy">Setze fertige Dataset-Bilder zuerst auf approved_dataset und prüfe sie im Approved Dataset Export.</p>
        </div>
      )}

      <div className="grid two-col">
        {plan.targets.map((target) => (
          <article className="card export-card" key={target.targetId} style={target.readiness === 'ready' ? { borderColor: 'rgba(120,255,170,0.36)' } : undefined}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{target.targetType || 'missing type'}</p>
                <h3>{target.targetLabel}</h3>
              </div>
              <span className={`status-badge ${readinessStatusClass(target.readiness)}`}>{readinessLabel(target.readiness)}</span>
            </div>

            <div className="chips">
              <span>{target.readyItemCount}/{target.minimumImages} minimum</span>
              <span>{target.recommendedImages} recommended</span>
              <span>{target.itemCount} total</span>
              <span>{target.warningItemCount} warnings</span>
              <span>{target.triggerWord || 'no trigger'}</span>
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Dataset Folder</p>
              <p>{target.datasetFolder}</p>
            </div>

            {target.warnings.length > 0 && (
              <div className="dialogue-box">
                <p className="eyebrow">Warnings</p>
                <ul>
                  {target.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            )}

            <details className="dialogue-box">
              <summary>Caption Files anzeigen</summary>
              <ul>
                {target.captionFiles.map((file) => <li key={file.captionFilePath}>{file.captionFilePath}</li>)}
              </ul>
            </details>

            <div className="review-actions">
              <button className="ghost-button" onClick={() => copyChecklist(target.targetId)}>Checklist kopieren</button>
              <a className="ghost-link" href="#/ricco-approved-dataset">Approved Dataset prüfen</a>
            </div>
          </article>
        ))}
      </div>

      <section className="card prompt-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Readiness Report</p>
            <h3>LoRA Training Checklist</h3>
          </div>
          <button className="ghost-button" onClick={copyReport}>Copy</button>
        </div>
        <textarea readOnly value={report} style={{ minHeight: 260 }} />
      </section>

      <section className="card prompt-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Raw Plan JSON</p>
            <h3>Debug / Archive</h3>
          </div>
          <button className="ghost-button" onClick={copyJson}>Copy JSON</button>
        </div>
        <textarea readOnly value={planJson} style={{ minHeight: 360 }} />
      </section>
    </section>
  );
}
