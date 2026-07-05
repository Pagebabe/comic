import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const statusPath = join(root, 'outputs', 'comfyui', 'pilot-fixes', 'pilot-fix-render-status.json');
const outRoot = join(root, 'outputs', 'comfyui', 'pilot-fixes');
const historyReportPath = join(outRoot, 'pilot-fix-history-report.json');

const endpoint = process.env.COMFYUI_URL ?? 'http://127.0.0.1:8188';
const allowHistory = process.env.COMFYUI_ALLOW_HISTORY === '1';
const shouldPoll = process.argv.includes('--poll');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    console.error('Run first: node scripts/createPilotFixRenderStatus.mjs');
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assertSafeToPoll() {
  if (!shouldPoll) return { ok: false, reason: 'Dry run only. Add --poll to query ComfyUI fix history.' };
  if (!allowHistory) return { ok: false, reason: 'Missing COMFYUI_ALLOW_HISTORY=1.' };
  return { ok: true, reason: 'Fix history polling enabled by explicit flag and environment.' };
}

function summarizeHistory(promptId, body) {
  const record = body?.[promptId] ?? body;
  const outputs = record?.outputs ?? {};
  const outputNodes = Object.entries(outputs).map(([nodeId, output]) => {
    const images = Array.isArray(output?.images) ? output.images : [];
    return {
      nodeId,
      imageCount: images.length,
      images: images.map((image) => ({
        filename: image.filename ?? null,
        subfolder: image.subfolder ?? null,
        type: image.type ?? null
      }))
    };
  });

  const imageCount = outputNodes.reduce((sum, node) => sum + node.imageCount, 0);

  return {
    promptId,
    completed: imageCount > 0,
    imageCount,
    outputNodes
  };
}

async function pollHistory(promptId) {
  const response = await fetch(`${endpoint}/history/${promptId}`);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    promptId,
    body,
    summary: response.ok && typeof body === 'object' ? summarizeHistory(promptId, body) : null
  };
}

const status = readJson(statusPath, 'fix render status');
const readyItems = Array.isArray(status.items)
  ? status.items.filter((item) => item.readyForHistoryPolling && item.promptId)
  : [];
const selectedItems = Number.isFinite(limit) && limit > 0 ? readyItems.slice(0, limit) : readyItems;
const pollGate = assertSafeToPoll();
const results = [];

if (pollGate.ok) {
  for (const item of selectedItems) {
    const result = await pollHistory(item.promptId);
    results.push({
      id: item.id,
      panelId: item.panelId,
      sourceFixJobId: item.sourceFixJobId,
      promptId: item.promptId,
      decision: item.decision,
      reviewNote: item.reviewNote,
      attempt: item.attempt,
      outputPath: item.outputPath,
      reviewTarget: item.reviewTarget,
      ok: result.ok,
      httpStatus: result.status,
      completed: result.summary?.completed ?? false,
      imageCount: result.summary?.imageCount ?? 0,
      outputNodes: result.summary?.outputNodes ?? [],
      rawBody: result.body
    });
  }
}

const previews = pollGate.ok
  ? []
  : selectedItems.map((item) => ({
      id: item.id,
      panelId: item.panelId,
      sourceFixJobId: item.sourceFixJobId,
      promptId: item.promptId,
      decision: item.decision,
      attempt: item.attempt,
      method: 'GET',
      url: `${endpoint}/history/${item.promptId}`,
      reviewTarget: item.reviewTarget
    }));

const completed = results.filter((item) => item.completed).length;
const failed = results.filter((item) => item.ok === false).length;

const report = {
  id: 'pilot_fix_comfy_history_report',
  createdAt: new Date().toISOString(),
  endpoint,
  sourceStatus: 'outputs/comfyui/pilot-fixes/pilot-fix-render-status.json',
  mode: pollGate.ok ? 'fix_history_poll_enabled' : 'dry_run_blocked',
  pollGate,
  totalReadyItems: readyItems.length,
  selectedItems: selectedItems.length,
  completed,
  failed,
  previews,
  results,
  nextStep: pollGate.ok ? 'Merge completed fix outputs back into the panel review manifests.' : 'Set COMFYUI_ALLOW_HISTORY=1 and pass --poll after real fix prompts are queued.'
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(historyReportPath, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote outputs/comfyui/pilot-fixes/pilot-fix-history-report.json');
console.log(`mode: ${report.mode}`);
console.log(`ready items: ${readyItems.length}`);
console.log(`selected items: ${selectedItems.length}`);
console.log(`completed: ${completed}`);
console.log(`failed: ${failed}`);
