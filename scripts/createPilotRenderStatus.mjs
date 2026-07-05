import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const runnerReportPath = join(root, 'outputs', 'comfyui', 'pilot', 'pilot-comfy-runner-report.json');
const outRoot = join(root, 'outputs', 'comfyui', 'pilot');
const statusPath = join(outRoot, 'pilot-render-status.json');

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    console.error('Run first: node scripts/runPilotComfyRunner.mjs');
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function extractPromptId(result) {
  const body = result?.body;
  if (!body) return null;
  if (typeof body === 'object' && body.prompt_id) return body.prompt_id;
  if (typeof body === 'object' && body.promptId) return body.promptId;
  return null;
}

function statusFromPreview(preview) {
  return {
    id: preview.id,
    panelId: preview.panelId,
    status: 'dry_run_only',
    promptId: null,
    httpStatus: null,
    ok: false,
    readyForHistoryPolling: false,
    needsSend: true,
    source: 'requestPreviews',
    outputPath: preview.request?.prompt?.['7']?.inputs?.filename_prefix ?? null,
    reviewTarget: preview.request?.extra_data?.reviewTarget ?? null,
    nextAction: 'Run guarded runner with --send when ready.'
  };
}

function statusFromResult(result) {
  const promptId = extractPromptId(result);
  const ok = Boolean(result.ok && promptId);

  return {
    id: result.id,
    panelId: result.panelId,
    status: ok ? 'queued_in_comfyui' : 'send_failed_or_no_prompt_id',
    promptId,
    httpStatus: result.status ?? null,
    ok,
    readyForHistoryPolling: ok,
    needsSend: !ok,
    source: 'results',
    outputPath: null,
    reviewTarget: null,
    nextAction: ok ? 'Poll ComfyUI history for this prompt_id.' : 'Inspect runner report and retry this panel.'
  };
}

const report = readJson(runnerReportPath, 'runner report');
const results = Array.isArray(report.results) ? report.results : [];
const previews = Array.isArray(report.requestPreviews) ? report.requestPreviews : [];

const statuses = results.length > 0
  ? results.map(statusFromResult)
  : previews.map(statusFromPreview);

const counts = statuses.reduce((acc, item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
}, {});

const statusPayload = {
  id: 'pilot_render_status',
  createdAt: new Date().toISOString(),
  sourceReport: 'outputs/comfyui/pilot/pilot-comfy-runner-report.json',
  runnerMode: report.mode,
  endpoint: report.endpoint,
  totalBatchItems: report.totalBatchItems ?? statuses.length,
  trackedItems: statuses.length,
  sentRequests: report.sentRequests ?? results.length,
  counts,
  readyForHistoryPolling: statuses.filter((item) => item.readyForHistoryPolling).length,
  needsSend: statuses.filter((item) => item.needsSend).length,
  items: statuses
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(statusPath, JSON.stringify(statusPayload, null, 2), 'utf8');

console.log('wrote outputs/comfyui/pilot/pilot-render-status.json');
console.log(`tracked items: ${statusPayload.trackedItems}`);
console.log(`ready for history polling: ${statusPayload.readyForHistoryPolling}`);
console.log(`needs send: ${statusPayload.needsSend}`);
