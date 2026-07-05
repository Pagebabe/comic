import { useMemo, useState } from 'react';
import {
  buildGenerationJobCopyText,
  buildGenerationQueueJson,
  createMissingRiccoGenerationJobs,
  generationJobStatusClass,
  summarizeGenerationQueue
} from '../domain/generation/riccoGenerationQueue';
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

export function RiccoGenerationQueue() {
  const [jobs, setJobs] = useState<GenerationJob[]>(() => readLocalGenerationJobs());
  const [copyStatus, setCopyStatus] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const comfyConfig = useMemo(() => getComfyUiBrowserConfig(), []);
  const report = useMemo(() => summarizeGenerationQueue(jobs), [jobs]);
  const jsonExport = useMemo(() => buildGenerationQueueJson(jobs), [jobs]);

  function flashStatus(message: string, timeout = 1500) {
    setCopyStatus(message);
    window.setTimeout(() => setCopyStatus(''), timeout);
  }

  function refreshJobs() {
    setJobs(readLocalGenerationJobs());
    flashStatus('Queue neu geladen');
  }

  function createJobsFromPrompts() {
    const currentJobs = readLocalGenerationJobs();
    const { mergedJobs, addedCount, preservedCount } = createMissingRiccoGenerationJobs(currentJobs);

    writeLocalGenerationJobs(mergedJobs);
    setJobs(mergedJobs);
    flashStatus(`${addedCount} neue Jobs erstellt, ${preservedCount} bestehende behalten`, 2200);
  }

  function clearQueue() {
    clearLocalGenerationJobs();
    setJobs([]);
    flashStatus('Queue geleert');
  }

  async function copyJob(job: GenerationJob) {
    await navigator.clipboard.writeText(buildGenerationJobCopyText(job));
    flashStatus(`${job.id} kopiert`);
  }

  async function copyAdapterPayload(job: GenerationJob) {
    await navigator.clipboard.writeText(JSON.stringify(buildMinimalComfyUiPayload(job), null, 2));
    flashStatus('Adapter Payload kopiert');
  }

  function updateStatus(job: GenerationJob, status: GenerationJobStatus) {
    updateLocalGenerationJobStatus(job.id, status);
    setJobs(readLocalGenerationJobs());
  }

  async function exportQueue() {
    await navigator.clipboard.writeText(jsonExport);
    flashStatus('Generation Queue JSON kopiert');
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

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Generation Queue v0.2</p>
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
          <button className="primary-button" onClick={createJobsFromPrompts}>Fehlende Jobs aus Prompt Queue erstellen</button>
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
            <p className="body-copy">Erstelle die fehlenden Jobs aus der bestehenden Ricco Prompt Queue. Es wird 1 Job pro noch fehlendem Panel mit Seed, Settings und Output-Pfad angelegt.</p>
          </article>
        )}

        {jobs.map((job) => (
          <article className="card prompt-card" key={job.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{job.panelId ?? job.subjectId ?? job.id}</p>
                <h3>{job.notes ?? job.id}</h3>
              </div>
              <span className={`status-badge ${generationJobStatusClass(job.status)}`}>{job.status}</span>
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
