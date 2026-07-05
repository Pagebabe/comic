import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import template from '../src/data/assetIntakeTemplate.json' assert { type: 'json' };

const root = process.cwd();
const batchPath = join(root, 'outputs', 'pilot', 'jobs', 'comfyui', 'ep001_comfyui_repair_batch.json');
const intakeRoot = join(root, 'outputs', 'pilot', 'intake');
const outPath = join(intakeRoot, 'ep001_asset_intake.json');

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Missing file: ${path.replace(`${root}/`, '')}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

const batch = readJson(batchPath);
const items = batch.items ?? [];

const intake = items.map((item) => {
  const assetPath = item.inputs?.output_path ?? null;
  const existsOnDisk = assetPath ? existsSync(join(root, assetPath)) : false;
  return {
    intake_id: `intake_${item.id}`,
    episode_id: item.episode_id,
    scene_id: item.scene_id,
    tv_shot_id: item.tv_shot_id,
    job_id: item.id,
    source: 'comfyui_batch_plan',
    source_job_path: batchPath.replace(`${root}/`, ''),
    asset_path: assetPath,
    exists_on_disk: existsOnDisk,
    status: existsOnDisk ? 'ready_for_review' : 'waiting_for_file',
    review_target: item.review_target,
    created_at: new Date().toISOString()
  };
});

const report = {
  template_id: template.id,
  episode_id: 'ep001',
  count: intake.length,
  ready_for_review: intake.filter((item) => item.status === 'ready_for_review').length,
  waiting_for_file: intake.filter((item) => item.status === 'waiting_for_file').length,
  intake
};

mkdirSync(intakeRoot, { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote outputs/pilot/intake/ep001_asset_intake.json');
console.log(`Items: ${report.count}`);
console.log(`Ready for review: ${report.ready_for_review}`);
console.log(`Waiting for file: ${report.waiting_for_file}`);
