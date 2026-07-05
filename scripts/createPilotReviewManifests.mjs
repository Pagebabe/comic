import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const historyReportPath = join(root, 'outputs', 'comfyui', 'pilot', 'pilot-history-report.json');
const renderStatusPath = join(root, 'outputs', 'comfyui', 'pilot', 'pilot-render-status.json');
const outRoot = join(root, 'outputs', 'review', 'pilot');
const indexPath = join(outRoot, 'index.json');

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
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
      id: `${result.panelId}_${node.nodeId}_${index + 1}`,
      nodeId: node.nodeId,
      filename: image.filename ?? null,
      subfolder: image.subfolder ?? null,
      type: image.type ?? null,
      estimatedPath: imagePathFromComfyImage(image)
    }));
  });
}

function statusLookup(renderStatus) {
  const items = Array.isArray(renderStatus.items) ? renderStatus.items : [];
  return new Map(items.map((item) => [item.panelId, item]));
}

const historyReport = readJson(historyReportPath, 'history report');
const renderStatus = existsSync(renderStatusPath)
  ? readJson(renderStatusPath, 'render status')
  : { items: [] };
const byPanel = statusLookup(renderStatus);
const completedResults = Array.isArray(historyReport.results)
  ? historyReport.results.filter((item) => item.completed && item.imageCount > 0)
  : [];

const manifests = completedResults.map((result) => {
  const statusItem = byPanel.get(result.panelId);
  const images = flattenImages(result);

  return {
    id: `review_${result.panelId}`,
    panelId: result.panelId,
    renderJobId: result.id,
    promptId: result.promptId,
    createdAt: new Date().toISOString(),
    status: 'pending_review',
    decision: null,
    reviewer: null,
    images,
    primaryImage: images[0]?.estimatedPath ?? null,
    source: {
      historyReport: 'outputs/comfyui/pilot/pilot-history-report.json',
      renderStatus: 'outputs/comfyui/pilot/pilot-render-status.json',
      promptId: result.promptId,
      httpStatus: result.httpStatus,
      outputNodes: result.outputNodes
    },
    panelStatus: statusItem?.status ?? null,
    checks: [
      { id: 'character_consistency', label: 'Character consistency', status: 'unchecked', notes: '' },
      { id: 'location_consistency', label: 'Location consistency', status: 'unchecked', notes: '' },
      { id: 'clean_frame_no_text', label: 'No text or speech bubbles in image', status: 'unchecked', notes: '' },
      { id: 'readable_composition', label: 'Readable panel composition', status: 'unchecked', notes: '' },
      { id: 'face_and_hands_ok', label: 'Faces and hands usable', status: 'unchecked', notes: '' },
      { id: 'matches_panel_action', label: 'Matches planned panel action', status: 'unchecked', notes: '' }
    ],
    allowedDecisions: ['approved', 'needs_fix', 'retry', 'rejected'],
    nextAction: 'Open the image, complete checks, then set decision.'
  };
});

mkdirSync(outRoot, { recursive: true });

const indexItems = manifests.map((manifest) => {
  const manifestPath = join(outRoot, `${manifest.panelId}.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return {
    panelId: manifest.panelId,
    promptId: manifest.promptId,
    status: manifest.status,
    decision: manifest.decision,
    primaryImage: manifest.primaryImage,
    manifestFile: `outputs/review/pilot/${manifest.panelId}.json`
  };
});

const index = {
  id: 'pilot_review_manifest_index',
  createdAt: new Date().toISOString(),
  sourceHistoryReport: 'outputs/comfyui/pilot/pilot-history-report.json',
  completedHistoryItems: completedResults.length,
  manifestCount: manifests.length,
  outputRoot: 'outputs/review/pilot',
  items: indexItems,
  nextStep: manifests.length > 0
    ? 'Review generated panel images and set decisions.'
    : 'No completed history outputs found yet. Poll history after real renders finish.'
};

writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

console.log('wrote outputs/review/pilot/index.json');
console.log(`review manifests: ${manifests.length}`);
console.log(`completed history items: ${completedResults.length}`);
