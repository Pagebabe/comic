import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outRoot = join(root, 'outputs', 'status');
const statusPath = join(outRoot, 'pilot-production-status.json');
const indexPath = join(outRoot, 'index.json');

const sources = {
  promptPack: 'outputs/prompt-packs/pilot-prompts.json',
  renderQueue: 'outputs/render-queue/pilot-render-queue.json',
  renderStatus: 'outputs/comfyui/pilot/pilot-render-status.json',
  historyReport: 'outputs/comfyui/pilot/pilot-history-report.json',
  reviewIndex: 'outputs/review/pilot/index.json',
  decisionLog: 'outputs/review/pilot/decision-log.json',
  fixJobIndex: 'outputs/fix-jobs/pilot/index.json',
  fixRenderQueue: 'outputs/render-queue/pilot-fix-render-queue.json',
  fixRenderStatus: 'outputs/comfyui/pilot-fixes/pilot-fix-render-status.json',
  fixHistoryReport: 'outputs/comfyui/pilot-fixes/pilot-fix-history-report.json',
  fixMergeReport: 'outputs/review/pilot/fix-merge-report.json'
};

function readJson(relativePath, fallback) {
  const path = join(root, relativePath);
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function indexBy(items, key) {
  const map = new Map();
  for (const item of list(items)) {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (value) map.set(value, item);
  }
  return map;
}

function groupBy(items, key) {
  const map = new Map();
  for (const item of list(items)) {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (!value) continue;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item);
  }
  return map;
}

function latestByPanel(items) {
  const latest = new Map();
  for (const item of list(items)) {
    if (!item.panelId) continue;
    latest.set(item.panelId, item);
  }
  return latest;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function stateForPanel({ review, decision, render, history, fixJob, fixRender, fixHistory, fixMerge }) {
  if (decision?.decision === 'approved' || review?.decision === 'approved') return 'approved';
  if (decision?.decision === 'rejected' || review?.decision === 'rejected') return 'rejected';

  if (decision?.decision === 'needs_fix' || decision?.decision === 'retry') {
    if (fixMerge) return 'fix_merged_pending_review';
    if (fixHistory?.completed) return 'fix_ready_to_merge';
    if (fixRender?.readyForHistoryPolling) return 'fix_waiting_history';
    if (fixRender?.needsSend || fixRender?.status === 'dry_run_only') return 'fix_ready_to_send';
    if (fixJob) return 'fix_job_queued';
    return 'fix_needed';
  }

  if (review?.status === 'pending_review') return 'pending_review';
  if (history?.completed) return 'ready_for_review_manifest';
  if (render?.readyForHistoryPolling) return 'waiting_history';
  if (render?.needsSend || render?.status === 'dry_run_only') return 'ready_to_send';
  return 'prompt_ready';
}

function nextActionForState(state) {
  const actions = {
    approved: 'Keep panel for final assembly.',
    rejected: 'Do not use this render unless reopened manually.',
    fix_merged_pending_review: 'Review fixed image and set a new decision.',
    fix_ready_to_merge: 'Run mergePilotFixHistoryToReview.mjs.',
    fix_waiting_history: 'Poll fix ComfyUI history.',
    fix_ready_to_send: 'Run guarded fix runner when ready.',
    fix_job_queued: 'Create fix render queue and fix Comfy batch.',
    fix_needed: 'Create fix jobs from review decisions.',
    pending_review: 'Open review manifest and decide approved, needs_fix, retry or rejected.',
    ready_for_review_manifest: 'Create or update review manifests.',
    waiting_history: 'Poll ComfyUI history.',
    ready_to_send: 'Run guarded ComfyUI runner when ready.',
    prompt_ready: 'Create render queue and Comfy batch if not already done.'
  };
  return actions[state] ?? 'Inspect panel status.';
}

const promptPack = readJson(sources.promptPack, []);
const renderQueue = readJson(sources.renderQueue, { items: [] });
const renderStatus = readJson(sources.renderStatus, { items: [] });
const historyReport = readJson(sources.historyReport, { results: [] });
const reviewIndex = readJson(sources.reviewIndex, { items: [] });
const decisionLog = readJson(sources.decisionLog, { items: [] });
const fixJobIndex = readJson(sources.fixJobIndex, { jobs: [] });
const fixRenderQueue = readJson(sources.fixRenderQueue, { items: [] });
const fixRenderStatus = readJson(sources.fixRenderStatus, { items: [] });
const fixHistoryReport = readJson(sources.fixHistoryReport, { results: [] });
const fixMergeReport = readJson(sources.fixMergeReport, { merged: [] });

const promptByPanel = indexBy(promptPack, 'panelId');
const renderQueueByPanel = indexBy(renderQueue.items, 'panelId');
const renderStatusByPanel = indexBy(renderStatus.items, 'panelId');
const historyByPanel = latestByPanel(historyReport.results);
const reviewByPanel = indexBy(reviewIndex.items, 'panelId');
const decisionByPanel = latestByPanel(decisionLog.items);
const fixJobsByPanel = groupBy(fixJobIndex.jobs, 'panelId');
const fixQueueByPanel = groupBy(fixRenderQueue.items, 'panelId');
const fixRenderStatusByPanel = indexBy(fixRenderStatus.items, 'panelId');
const fixHistoryByPanel = latestByPanel(fixHistoryReport.results);
const fixMergeByPanel = latestByPanel(fixMergeReport.merged);

const panelIds = unique([
  ...list(promptPack).map((item) => item.panelId),
  ...list(renderQueue.items).map((item) => item.panelId),
  ...list(renderStatus.items).map((item) => item.panelId),
  ...list(historyReport.results).map((item) => item.panelId),
  ...list(reviewIndex.items).map((item) => item.panelId),
  ...list(decisionLog.items).map((item) => item.panelId),
  ...list(fixJobIndex.jobs).map((item) => item.panelId),
  ...list(fixRenderQueue.items).map((item) => item.panelId),
  ...list(fixRenderStatus.items).map((item) => item.panelId),
  ...list(fixHistoryReport.results).map((item) => item.panelId),
  ...list(fixMergeReport.merged).map((item) => item.panelId)
]).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

const panels = panelIds.map((panelId) => {
  const prompt = promptByPanel.get(panelId);
  const renderQueueItem = renderQueueByPanel.get(panelId);
  const render = renderStatusByPanel.get(panelId);
  const history = historyByPanel.get(panelId);
  const review = reviewByPanel.get(panelId);
  const decision = decisionByPanel.get(panelId);
  const fixJobs = fixJobsByPanel.get(panelId) ?? [];
  const fixQueueItems = fixQueueByPanel.get(panelId) ?? [];
  const fixRender = fixRenderStatusByPanel.get(panelId);
  const fixHistory = fixHistoryByPanel.get(panelId);
  const fixMerge = fixMergeByPanel.get(panelId);
  const state = stateForPanel({ review, decision, render, history, fixJob: fixJobs.at(-1), fixRender, fixHistory, fixMerge });

  return {
    panelId,
    state,
    nextAction: nextActionForState(state),
    sceneId: prompt?.sceneId ?? renderQueueItem?.sceneId ?? null,
    sceneTitle: prompt?.sceneTitle ?? renderQueueItem?.sceneTitle ?? null,
    shotType: prompt?.shotType ?? null,
    dialogue: prompt?.dialogue ?? null,
    render: {
      queueItemId: renderQueueItem?.id ?? null,
      status: render?.status ?? null,
      promptId: render?.promptId ?? null,
      readyForHistoryPolling: Boolean(render?.readyForHistoryPolling),
      needsSend: Boolean(render?.needsSend),
      outputPath: render?.outputPath ?? renderQueueItem?.inputs?.outputPath ?? null
    },
    history: {
      completed: Boolean(history?.completed),
      imageCount: history?.imageCount ?? 0,
      promptId: history?.promptId ?? null
    },
    review: {
      status: review?.status ?? null,
      decision: review?.decision ?? null,
      primaryImage: review?.primaryImage ?? null,
      manifestFile: review?.manifestFile ?? `outputs/review/pilot/${panelId}.json`
    },
    decision: decision ? {
      value: decision.decision,
      note: decision.note ?? '',
      reviewer: decision.reviewer ?? null,
      decidedAt: decision.decidedAt ?? null
    } : null,
    fix: {
      jobCount: fixJobs.length,
      latestJobId: fixJobs.at(-1)?.id ?? null,
      queueItemCount: fixQueueItems.length,
      latestQueueItemId: fixQueueItems.at(-1)?.id ?? null,
      renderStatus: fixRender?.status ?? null,
      promptId: fixRender?.promptId ?? fixHistory?.promptId ?? null,
      attempt: fixRender?.attempt ?? fixHistory?.attempt ?? null,
      readyForHistoryPolling: Boolean(fixRender?.readyForHistoryPolling),
      historyCompleted: Boolean(fixHistory?.completed),
      historyImageCount: fixHistory?.imageCount ?? 0,
      latestMergePromptId: fixMerge?.promptId ?? null,
      latestMergeAt: fixMerge?.mergedAt ?? null
    }
  };
});

const counts = panels.reduce((acc, panel) => {
  acc[panel.state] = (acc[panel.state] ?? 0) + 1;
  return acc;
}, {});

const sourceAvailability = Object.fromEntries(
  Object.entries(sources).map(([key, relativePath]) => [key, existsSync(join(root, relativePath))])
);

const productionStatus = {
  id: 'pilot_production_status',
  createdAt: new Date().toISOString(),
  episodeId: 'episode_001',
  seriesTitle: 'Rico gegen Berlin',
  panelCount: panels.length,
  counts,
  sourceAvailability,
  sources,
  panels,
  nextStep: 'Use this file as the single data source for the Studio Control Room UI.'
};

const statusIndex = {
  id: 'status_index',
  createdAt: productionStatus.createdAt,
  files: [
    {
      id: productionStatus.id,
      path: 'outputs/status/pilot-production-status.json',
      panelCount: productionStatus.panelCount,
      counts: productionStatus.counts
    }
  ]
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(statusPath, JSON.stringify(productionStatus, null, 2), 'utf8');
writeFileSync(indexPath, JSON.stringify(statusIndex, null, 2), 'utf8');

console.log('wrote outputs/status/pilot-production-status.json');
console.log('wrote outputs/status/index.json');
console.log(`panels: ${productionStatus.panelCount}`);
console.log(JSON.stringify(counts, null, 2));
