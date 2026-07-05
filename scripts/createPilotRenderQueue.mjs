import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const promptPackPath = join(root, 'outputs', 'prompt-packs', 'pilot-prompts.json');
const outRoot = join(root, 'outputs', 'render-queue');
const queuePath = join(outRoot, 'pilot-render-queue.json');
const indexPath = join(outRoot, 'index.json');

if (!existsSync(promptPackPath)) {
  console.error('Missing outputs/prompt-packs/pilot-prompts.json');
  console.error('Run first: node scripts/createPilotPromptPack.mjs');
  process.exit(1);
}

const prompts = JSON.parse(readFileSync(promptPackPath, 'utf8'));

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

function padPanelNumber(panelId) {
  const match = panelId.match(/(\d+)$/);
  return match ? match[1].padStart(3, '0') : panelId;
}

const items = prompts.map((item, index) => {
  const panelNumber = padPanelNumber(item.panelId);
  const sceneNumber = String(item.sceneOrder ?? 0).padStart(2, '0');
  const sceneSlug = item.sceneTitle
    ? item.sceneTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : item.sceneId;

  return {
    id: `render_${item.panelId}`,
    priority: index + 1,
    episodeId: 'episode_001',
    panelId: item.panelId,
    sceneId: item.sceneId,
    sceneOrder: item.sceneOrder,
    sceneTitle: item.sceneTitle,
    location: item.location,
    status: 'queued',
    attempt: 1,
    workflowTemplate: 'comic_panel_clean_v1',
    renderer: 'manual_or_comfyui_later',
    inputs: {
      positivePrompt: item.prompt,
      negativePrompt,
      width: 1080,
      height: 1350,
      seed: -1,
      steps: 30,
      cfg: 4.5,
      sampler: 'dpmpp_2m',
      scheduler: 'karras',
      outputPath: `outputs/renders/pilot/scene_${sceneNumber}_${sceneSlug}/${panelNumber}_${item.panelId}.png`
    },
    review: {
      required: true,
      target: `outputs/review/pilot/${item.panelId}.json`,
      checks: [
        'character_consistency',
        'location_consistency',
        'clean_frame_no_text',
        'readable_composition',
        'face_and_hands_ok',
        'matches_panel_action'
      ]
    },
    source: {
      promptPack: 'outputs/prompt-packs/pilot-prompts.json',
      dialogue: item.dialogue,
      visualDescription: item.visualDescription,
      action: item.action,
      mood: item.mood,
      shotType: item.shotType
    }
  };
});

const queue = {
  id: 'rico_gegen_berlin_pilot_render_queue',
  createdAt: new Date().toISOString(),
  episodeId: 'episode_001',
  mode: 'queued_clean_comic_panels',
  itemCount: items.length,
  outputRoot: 'outputs/render-queue',
  renderRoot: 'outputs/renders/pilot',
  items
};

const index = {
  id: queue.id,
  createdAt: queue.createdAt,
  itemCount: queue.itemCount,
  queueFile: 'outputs/render-queue/pilot-render-queue.json',
  sourcePromptPack: 'outputs/prompt-packs/pilot-prompts.json',
  nextStep: 'Use this queue for a manual render pass or a later ComfyUI adapter.'
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

console.log('wrote outputs/render-queue/pilot-render-queue.json');
console.log('wrote outputs/render-queue/index.json');
console.log(`render queue items: ${items.length}`);
