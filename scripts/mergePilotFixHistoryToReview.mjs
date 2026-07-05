import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const fixHistoryPath = join(root, 'outputs', 'comfyui', 'pilot-fixes', 'pilot-fix-history-report.json');
const reviewRoot = join(root, 'outputs', 'review', 'pilot');
const reviewIndexPath = join(reviewRoot, 'index.json');
const mergeReportPath = join(reviewRoot, 'fix-merge-report.json');

function readJson(path, label, fallback = null) {
  if (!existsSync(path)) {
    if (fallback !== null) return fallback;
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    console.error('Run first: node scripts/pollPilotFixComfyHistory.mjs');
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf8');
}

function imagePathFromComfyImage(image) {
  const parts = ['outputs'];
  if (image.subfolder) parts.push(image.subfolder);
  if (image.filename) parts.push(image.filename);
  return parts.join('/');
}

function flattenImages(result) {
  const nodes = Array.isArray(result.outputNodes) ? result.outputNodes : [];
  return nodes.flatMap((node) => {
    const images = Array.isArray(node.images) ? node.images : [];
    return images.map((image, index) => ({
      id: `${result.panelId}_${result.sourceFixJobId}_${node.nodeId}_${index + 1}`,
      nodeId: node.nodeId,
      filename: image.filename ?? null,
      subfolder: image.subfolder ?? null,
      type: image.type ?? null,
      estimatedPath: imagePathFromComfyImage(image),
      source: 'fix_history',
      sourceFixJobId: result.sourceFixJobId,
      promptId: result.promptId,
      attempt: result.attempt,
      decision: result.decision,
      reviewNote: result.reviewNote
    }));
  });
}

function uniqueByImageId(images) {
  const seen = new Set();
  const out = [];
  for (const image of images) {
    const key = image.id ?? image.estimatedPath ?? JSON.stringify(image);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(image);
  }
  return out;
}

function resetChecks(checks) {
  const existing = Array.isArray(checks) ? checks : [];
  const requiredIds = [
    ['character_consistency', 'Character consistency'],
    ['location_consistency', 'Location consistency'],
    ['clean_frame_no_text', 'No text or speech bubbles in image'],
    ['readable_composition', 'Readable panel composition'],
    ['face_and_hands_ok', 'Faces and hands usable'],
    ['matches_panel_action', 'Matches planned panel action'],
    ['review_note_resolved', 'Reviewer note resolved']
  ];

  return requiredIds.map(([id, label]) => {
    const old = existing.find((item) => item.id === id);
    return {
      id,
      label: old?.label ?? label,
      status: 'unchecked',
      notes: ''
    };
  });
}

const historyReport = readJson(fixHistoryPath, 'fix history report');
const completedResults = Array.isArray(historyReport.results)
  ? historyReport.results.filter((item) => item.completed && item.imageCount > 0)
  : [];

const reviewIndex = readJson(reviewIndexPath, 'review index', {
  id: 'pilot_review_manifest_index',
  createdAt: new Date().toISOString(),
  outputRoot: 'outputs/review/pilot',
  items: []
});

const merged = [];
const skipped = [];

for (const result of completedResults) {
  const manifestPath = join(root, result.reviewTarget ?? `outputs/review/pilot/${result.panelId}.json`);
  if (!existsSync(manifestPath)) {
    skipped.push({ panelId: result.panelId, reason: 'missing_manifest', manifestPath: manifestPath.replace(`${root}/`, '') });
    continue;
  }

  const manifest = readJson(manifestPath, 'review manifest');
  const images = flattenImages(result);
  if (images.length === 0) {
    skipped.push({ panelId: result.panelId, reason: 'no_images_in_history', promptId: result.promptId });
    continue;
  }

  const mergedAt = new Date().toISOString();
  const previousImages = Array.isArray(manifest.images) ? manifest.images : [];
  const updatedImages = uniqueByImageId([...previousImages, ...images]);
  const primaryImage = images[0]?.estimatedPath ?? manifest.primaryImage ?? null;

  const mergeEntry = {
    mergedAt,
    panelId: result.panelId,
    sourceFixJobId: result.sourceFixJobId,
    promptId: result.promptId,
    attempt: result.attempt,
    imageCount: images.length,
    primaryImage,
    decisionBeforeFix: result.decision,
    reviewNote: result.reviewNote,
    sourceHistoryReport: 'outputs/comfyui/pilot-fixes/pilot-fix-history-report.json'
  };

  const updatedManifest = {
    ...manifest,
    status: 'pending_review',
    decision: null,
    reviewedAt: null,
    reviewNote: '',
    images: updatedImages,
    primaryImage,
    latestFix: mergeEntry,
    fixHistory: [...(Array.isArray(manifest.fixHistory) ? manifest.fixHistory : []), mergeEntry],
    checks: resetChecks(manifest.checks),
    nextAction: 'Review the fixed image and set a new decision.'
  };

  writeJson(manifestPath, updatedManifest);
  merged.push({ panelId: result.panelId, sourceFixJobId: result.sourceFixJobId, promptId: result.promptId, images: images.length, manifestFile: manifestPath.replace(`${root}/`, '') });
}

const indexItems = Array.isArray(reviewIndex.items) ? reviewIndex.items : [];
const mergedByPanel = new Map(merged.map((item) => [item.panelId, item]));
const updatedIndexItems = indexItems.map((item) => {
  const merge = mergedByPanel.get(item.panelId);
  if (!merge) return item;
  const manifest = readJson(join(root, merge.manifestFile), 'review manifest');
  return {
    ...item,
    status: manifest.status,
    decision: manifest.decision,
    primaryImage: manifest.primaryImage,
    latestFixJobId: merge.sourceFixJobId,
    latestFixPromptId: merge.promptId,
    updatedAt: manifest.latestFix?.mergedAt ?? new Date().toISOString()
  };
});

const updatedReviewIndex = {
  ...reviewIndex,
  updatedAt: new Date().toISOString(),
  items: updatedIndexItems
};

const mergeReport = {
  id: 'pilot_fix_history_review_merge_report',
  createdAt: new Date().toISOString(),
  sourceHistoryReport: 'outputs/comfyui/pilot-fixes/pilot-fix-history-report.json',
  completedFixResults: completedResults.length,
  mergedCount: merged.length,
  skippedCount: skipped.length,
  merged,
  skipped,
  nextStep: merged.length > 0
    ? 'Open review manifests and decide approved, needs_fix, retry or rejected again.'
    : 'No completed fix outputs were available to merge.'
};

writeJson(reviewIndexPath, updatedReviewIndex);
writeJson(mergeReportPath, mergeReport);

console.log('wrote outputs/review/pilot/fix-merge-report.json');
console.log(`completed fix results: ${completedResults.length}`);
console.log(`merged: ${merged.length}`);
console.log(`skipped: ${skipped.length}`);
