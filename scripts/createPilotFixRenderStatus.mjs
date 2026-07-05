import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const runnerReportPath = join(root, 'outputs', 'comfyui', 'pilot-fixes', 'pilot-fix-comfy-runner-report.json');
const fixBatchPath = join(root, 'outputs', 'comfyui', 'pilot-fixes', 'pilot-fix-comfy-batch.json');
const outRoot = join(root, 'outputs', 'comfyui', 'pilot-fixes');
const statusPath = join(outRoot, 'pilot-fix-render-status.json');

function readJson(path, label, fallback = null) {
  if (!existsSync(path)) {
    if (fallback !== null) return fallback;
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    console.error('Run first: node scripts/runPilotFixComfyRunner.mjs');
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

function batchLookup(fixBatch) {
  const items = Array.isArray(fixBatch.items) ? fixBatch.items : [];
  return new Map(items.map((item) => [item.id, item]));
}

function statusFromPreview(preview, batchItem) {
  const extra = preview.request?.extra_data ?? {};
  const metadata = batchItem?.metadata ?? {};
  const slots = batchItem?.workflowSlots ?? preview.request?.prompt?.['7']?.inputs ?? {};

  return {
    id: preview.id,
    panelId: preview.panelId,
    sourceFixJobId: preview.sourceFixJobId ?? extra.sourceFixJobId ?? metadata.sourceFixJobId ?? null,
    status: 'dry_run_only',
    promptId: null,
    httpStatus: null,
    ok: false,
    readyForHistoryPolling: false,
    needsSend: true,
    source: 'requestPreviews',
    decision: extra.decision ?? metadata.decision ?? null,
    reviewNote: extra.reviewNote ?? metadata.reviewNote ?? '',
    attempt: extra.attempt ?? metadata.attempt ?? null,
    outputPath: slots.output_path ?? preview.request?.prompt?.['7']?.inputs?.filename_prefix ?? null,
    reviewTarget: extra.reviewTarget ?? metadata.reviewTarget ?? null,
    nextAction: 'Run guarded fix runner with --send when ready.'
  };
}

function statusFromResult(result, batchItem) {
  const promptId = extractPromptId(result);
  const ok = Boolean(result.ok && promptId);
  const metadata = batchItem?.metadata ?? {};
  const slots = batchItem?.workflowSlots ?? {};

  return {
    id: result.id,
    panelId: result.panelId,
    sourceFixJobId: result.sourceFixJobId ?? metadata.sourceFixJobId ?? null,
    status: ok ? 'queued_in_comfyui' : 'send_failed_or_no_prompt_id',
    promptId,
    httpStatus: result.status ?? null,
    ok,
    readyForHistoryPolling: ok,
    needsSend: !ok,
    source: 'results',
    decision: metadata.decision ?? null,
    reviewNote: metadata.reviewNote ?? '',
    attempt: metadata.attempt ?? null,
    outputPath: slots.output_path ?? null,
    reviewTarget: metadata.reviewTarget ?? null,
    nextAction: ok ? 'Poll ComfyUI history for this fix prompt_id.' : 'Inspect fix runner report and retry this fix job.'
  };
}

const report = readJson(runnerReportPath, 'fix runner report');
const fixBatch = readJson(fixBatchPath, 'fix Comfy batch', { items: [] });
const byId = batchLookup(fixBatch);
const results = Array.isArray(report.results) ? report.results : [];
const previews = Array.isArray(report.requestPreviews) ? report.requestPreviews : [];

const statuses = results.length > 0
  ? results.map((result) => statusFromResult(result, byId.get(result.id)))
  : previews.map((preview) => statusFromPreview(preview, byId.get(preview.id)));

const counts = statuses.reduce((acc, item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
}, {});

const statusPayload = {
  id: 'pilot_fix_render_status',
  createdAt: new Date().toISOString(),
  sourceReport: 'outputs/comfyui/pilot-fixes/pilot-fix-comfy-runner-report.json',
  sourceBatch: 'outputs/comfyui/pilot-fixes/pilot-fix-comfy-batch.json',
  runnerMode: report.mode,
  endpoint: report.endpoint,
  totalBatchItems: report.totalBatchItems ?? statuses.length,
  trackedItems: statuses.length,
  sentRequests: report.sentRequests ?? results.length,
  checkReportPassed: Boolean(report.checkReportPassed),
  counts,
  readyForHistoryPolling: statuses.filter((item) => item.readyForHistoryPolling).length,
  needsSend: statuses.filter((item) => item.needsSend).length,
  items: statuses
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(statusPath, JSON.stringify(statusPayload, null, 2), 'utf8');

console.log('wrote outputs/comfyui/pilot-fixes/pilot-fix-render-status.json');
console.log(`tracked items: ${statusPayload.trackedItems}`);
console.log(`ready for history polling: ${statusPayload.readyForHistoryPolling}`);
console.log(`needs send: ${statusPayload.needsSend}`);
