import { useMemo, useState } from 'react';
import { buildGenerationJobExport, createRiccoPanelGenerationJobs } from '../lib/generation/createRiccoGenerationJobs';
import {
  clearLocalGenerationJobs,
  readLocalGenerationJobs,
  updateLocalGenerationJobStatus,
  writeLocalGenerationJobs
} from '../lib/backend/localProductionStore';
import { buildMinimalComfyUiPayload, checkComfyUiHealth, getComfyUiBrowserConfig } from '../lib/comfyui/comfyUiClient';
import type { GenerationJob, GenerationJobStatus } from '../types/productionBackend';

function downloadText(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function statusClass(status: GenerationJobStatus | string) {
  if (['completed_manual', 'imported_as_asset', 'api_completed'].includes(status)) return 'status-active';
  if (['failed', 'api_failed', 'cancelled'].includes(status)) return 'status-rejected';
  return 'status-needs_fix';
}

function buildCopyText(job: GenerationJob) {
  return [
    `GENERATION JOB: ${job.id}`,
    `Panel: ${job.panelId ?? '-'}`,
    `Workflow: ${job.workflowId} / ${job.workflowVersion}`,
    `Output: ${job.outputPath}`,
    '',
    'POSITIVE PROMPT:',
    job.positivePrompt,
    '',
    'NEGATIVE PROMPT:',
    job.negativePrompt,
    '',
    'SETTINGS:',
    `model: ${job.modelId ?? '-'}`,
    `loras: ${job.loraIds.join(', ') || '-'}`,
    `seed: ${job.seed ?? '-'}`,
    `sampler: ${job.sampler}`,
    `steps: ${job.steps}`,
    `cfg: ${job.cfg}`,
    `resolution: ${job.resolutionWidth}x${job.resolutionHeight}`,
    `batch: ${job.batchSize}x${job.batchCount}`
  ].join('\n');
}

export function RiccoGenerationQueue() {
  const [jobs, setJobs] = useState<GenerationJob[]>(() => readLocalGenerationJobs());
  const [copyStatus, setCopyStatus] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const comfyConfig = useMemo(() => getComfyUiBrowserConfig(), []);

  const report = useMemo(() => {
    const completed = jobs.filter((job) => ['completed_manual', 'imported_as_asset', 'api_completed'].includes(job.status)).length;
    const failed = jobs.filter((job) => ['failed', 'api_failed', 'cancelled'].includes(job.status)).length;
    const active = jobs.length - completed - failed;

    return { completed, failed, active };
  }, [jobs]);

  function refreshJobs() {
    setJobs(readLocalGenerationJobs());
    setCopyStatus('Queue neu geladen');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  function createJobsFromPrompts() {
    const nextJobs = createRiccoPanelGenerationJobs();
    writeLocalGenerationJobs(nextJobs);
    setJobs(nextJobs);
    setCopyStatus(`${nextJobs.length} Jobs erstellt`);
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  function clearQueue() {
    clearLocalGenerationJobs();
    setJobs([]);
    setCopyStatus('Queue geleert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function copyJob(job: GenerationJob) {
    await navigator.clipboard.writeText(buildCopyText(job));
    setCopyStatus(`${job.id} kopiert`);
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function copyAdapterPayload(job: GenerationJob) {
    await navigator.clipboard.writeText(JSON.stringify(buildMinimalComfyUiPayload(job), null, 2));
    setCopyStatus(`Adapter Payload kopiert`);
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  function updateStatus(job: GenerationJob, status: GenerationJobStatus) {
    updateLocalGenerationJobStatus(job.id, status);
    setJobs(readLocalGenerationJobs());
  }

  async function exportQueue() {
    const payload = JSON.stringify(buildGenerationJobExport(jobs), null, 2);
    await navigator.clipboard.writeText(payload);
    setCopyStatus('Generation Queue JSON kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function runHealthCheck() {
    setHealthStatus('Prüfe ComfyUI...');

    try {
      await checkComfyUiHealth();
      setHealthStatus('ComfyUI erreichbar');
    } catch (error) {
      setHealthStatus(error instanceof Error ? error.message : 'ComfyUI nicht erreichbar');
    }
  }

  const jsonExport = JSON.stringify(buildGenerationJobExport(jobs), null, 2);

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Generation Queue v0.1</p>
        <h2>Prompt → Job → ComfyUI manuell/API-ready</h2>
        <p className="body-copy">
          Diese Queue übersetzt die bestehende Prompt Queue in nachvollziehbare Render-Jobs. V1 bleibt bewusst lokal und manuell, ist aber auf Supabase und ComfyUI API vorbereitet.
        </p>
        <div className="chips">
          <span>{jobs.length} Jobs</span>
          <span>{report.active} aktiv</span>
          <span>{report.completed} fertig</span>
          <span>{report.failed} failed/cancelled</span>
          <span>{comfyConfig.configured ? 'ComfyUI URL gesetzt' : 'ComfyUI URL fehlt'}</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={createJobsFromPrompts}>Jobs aus Prompt Queue erstellen</button>
          <button className="ghost-button" onClick={refreshJobs}>Neu laden</button>
          <button className="ghost-button" onClick={exportQueue}>JSON kopieren</button>
          <button className="ghost-button" onClick={() => downloadText(jsonExport, 'ricco-generation-queue-v1.json', 'application/json')}>JSON herunterladen</button>
          <button className="ghost-button" onClick={runHealthCheck}>ComfyUI Health</button>
          <button className="ghost-button" onClick={clearQueue}>Queue leeren</button>
        </div>
        {healthStatus && <div className="prompt-box">{healthStatus}</div>}
      </div>

      <div className="grid two-col">
        <section className="card rule-card">
          <p className="eyebrow">Manual Loop</p>
          <h3>So bleibt es kontrolliert</h3>
          <ul>
            <li>Job kopieren.</li>
            <li>Prompt und Settings in ComfyUI setzen.</li>
            <li>Status auf running_manual stellen.</li>
            <li>Bild erzeugen und in Asset Import / Bulk Upload übernehmen.</li>
            <li>Danach in Image Review bewerten.</li>
          </ul>
        </section>

        <section className="card rule-card">
          <p className="eyebrow">API später</p>
          <h3>Nicht blind automatisieren</h3>
          <ul>
            <li>ComfyUI API braucht echtes Workflow Mapping.</li>
            <li>Der Adapter Payload ist bewusst kein finaler Node Graph.</li>
            <li>Erst Mapping stabilisieren, dann API Submit aktivieren.</li>
            <li>Supabase bleibt optional, bis der lokale Loop sitzt.</li>
          </ul>
        </section>
      </div>

      <section className="page-stack compact-stack">
        {jobs.length === 0 && (
          <article className="card">
            <p className="eyebrow">Empty Queue</p>
            <h3>Noch keine Generation Jobs</h3>
            <p className="body-copy">Erstelle die Jobs aus der bestehenden Ricco Prompt Queue. Es werden 1 Job pro Panel mit Seed, Settings und Output-Pfad angelegt.</p>
          </article>
        )}

        {jobs.map((job) => (
          <article className="card prompt-card" key={job.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{job.panelId ?? job.subjectId ?? job.id}</p>
                <h3>{job.notes ?? job.id}</h3>
              </div>
              <span className={`status-badge ${statusClass(job.status)}`}>{job.status}</span>
            </div>

            <div className="shot-meta">
              <span>{job.workflowId}</span>
              <span>{job.resolutionWidth}×{job.resolutionHeight}</span>
              <span>{job.batchSize}×{job.batchCount}</span>
              <span>seed {job.seed}</span>
            </div>

            <p className="body-copy">Output: {job.outputPath}</p>

            <label>Positive Prompt</label>
            <textarea readOnly value={job.positivePrompt} />

            <label>Negative Prompt</label>
            <textarea readOnly value={job.negativePrompt} />

            <div className="review-actions">
              <button className="primary-button" onClick={() => copyJob(job)}>Job kopieren</button>
              <button className="ghost-button" onClick={() => copyAdapterPayload(job)}>Adapter Payload</button>
              <button className="ghost-button" onClick={() => updateStatus(job, 'copied_to_comfyui')}>copied</button>
              <button className="ghost-button" onClick={() => updateStatus(job, 'running_manual')}>running</button>
              <button className="ghost-button" onClick={() => updateStatus(job, 'completed_manual')}>completed</button>
              <button className="ghost-button" onClick={() => updateStatus(job, 'imported_as_asset')}>imported</button>
              <button className="ghost-button" onClick={() => updateStatus(job, 'failed')}>failed</button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
