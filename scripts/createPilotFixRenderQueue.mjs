import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const fixIndexPath = join(root, 'outputs', 'fix-jobs', 'pilot', 'index.json');
const outRoot = join(root, 'outputs', 'render-queue');
const queuePath = join(outRoot, 'pilot-fix-render-queue.json');
const indexPath = join(outRoot, 'pilot-fix-render-queue-index.json');

const negativePrompt = [
  'readable text',
  'speech bubbles',
  'subtitles inside image',
  'watermark',
  'logo',
  'fake UI',
  'poster text',
  'infographic',
  'photorealism',
  'broken face',
  'distorted hands',
  'extra random characters',
  'low quality',
  'blurry'
].join(', ');

function readJson(path, fallback = null) {
  if (!existsSync(path)) {
    if (fallback !== null) return fallback;
    console.error(`Missing file: ${path.replace(`${root}/`, '')}`);
    console.error('Run first: node scripts/createPilotFixJobs.mjs');
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function buildPositivePrompt(job) {
  return [
    job.originalPrompt,
    '',
    'FIX PASS:',
    job.instruction,
    '',
    job.sourceImage ? `Previous render reference path: ${job.sourceImage}` : null,
    job.reviewNote ? `Reviewer note: ${job.reviewNote}` : null,
    '',
    'Repair constraints:',
    ...(job.required ?? []).map((rule) => `must keep: ${rule}`),
    ...(job.forbidden ?? []).map((rule) => `avoid: ${rule}`)
  ].filter(Boolean).join('\n');
}

function queueItemFromJob(job, index) {
  const attempt = Math.max(2, Number(job.attempt ?? 1) + 1);

  return {
    id: `render_${job.id}`,
    priority: index + 1,
    episodeId: job.episodeId ?? 'episode_001',
    panelId: job.panelId,
    sourceFixJobId: job.id,
    sourceManifest: job.sourceManifest,
    sourceImage: job.sourceImage,
    sourcePromptId: job.sourcePromptId,
    decision: job.decision,
    reviewNote: job.reviewNote,
    status: 'queued',
    attempt,
    workflowTemplate: 'comic_panel_clean_v1',
    renderer: 'manual_or_comfyui_later',
    inputs: {
      positivePrompt: buildPositivePrompt(job),
      negativePrompt,
      width: 1080,
      height: 1350,
      seed: -1,
      steps: 30,
      cfg: 4.5,
      sampler: 'dpmpp_2m',
      scheduler: 'karras',
      outputPath: job.outputTarget
    },
    review: {
      required: true,
      target: job.reviewTarget,
      checks: [
        'character_consistency',
        'location_consistency',
        'clean_frame_no_text',
        'readable_composition',
        'face_and_hands_ok',
        'matches_panel_action',
        'review_note_resolved'
      ]
    },
    source: {
      fixJob: `outputs/fix-jobs/pilot/${job.id}.json`,
      originalDialogue: job.originalDialogue,
      originalVisualDescription: job.originalVisualDescription,
      originalAction: job.originalAction,
      instruction: job.instruction
    }
  };
}

const fixIndex = readJson(fixIndexPath, {
  id: 'pilot_fix_job_index',
  jobs: []
});

const fixJobs = (Array.isArray(fixIndex.jobs) ? fixIndex.jobs : [])
  .map((item) => readJson(join(root, item.path)))
  .filter((job) => job.status === 'queued');

const items = fixJobs.map(queueItemFromJob);

const queue = {
  id: 'rico_gegen_berlin_pilot_fix_render_queue',
  createdAt: new Date().toISOString(),
  episodeId: 'episode_001',
  mode: 'queued_fix_pass_comic_panels',
  sourceFixIndex: 'outputs/fix-jobs/pilot/index.json',
  itemCount: items.length,
  outputRoot: 'outputs/render-queue',
  renderRoot: 'outputs/renders/pilot/fixes',
  items
};

const index = {
  id: queue.id,
  createdAt: queue.createdAt,
  itemCount: queue.itemCount,
  queueFile: 'outputs/render-queue/pilot-fix-render-queue.json',
  sourceFixIndex: queue.sourceFixIndex,
  nextStep: items.length > 0
    ? 'Convert this fix render queue into a ComfyUI batch.'
    : 'No queued fix jobs found yet.'
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

console.log('wrote outputs/render-queue/pilot-fix-render-queue.json');
console.log('wrote outputs/render-queue/pilot-fix-render-queue-index.json');
console.log(`fix render queue items: ${items.length}`);
