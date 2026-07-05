import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, 'outputs', 'pilot', 'status');
const outPath = join(outDir, 'ep001_pipeline_overview.json');

const files = [
  'outputs/pilot/jobs/repairs/index.json',
  'outputs/pilot/jobs/comfyui/ep001_comfyui_repair_batch.json',
  'outputs/pilot/jobs/comfyui/ep001_comfyui_runner_dryrun.json',
  'outputs/pilot/jobs/comfyui/ep001_comfyui_preview_check.json',
  'outputs/pilot/intake/ep001_asset_intake.json',
  'outputs/pilot/voice/ep001_voice_package.json',
  'outputs/pilot/sound/ep001_sound_package.json',
  'outputs/pilot/assembly/ep001_assembly_package.json',
  'outputs/pilot/assembly/ep001_remotion_plan.json'
];

function readJson(relativePath, fallback) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

const tracked = files.map((path) => ({ path, exists: existsSync(join(root, path)) }));
const intake = readJson('outputs/pilot/intake/ep001_asset_intake.json', { count: 0, ready_for_review: 0, waiting_for_file: 0 });
const preview = readJson('outputs/pilot/jobs/comfyui/ep001_comfyui_preview_check.json', { status: 'missing', checks: [] });
const assembly = readJson('outputs/pilot/assembly/ep001_assembly_package.json', { ready_for_assembly: false, blockers: [] });

const overview = {
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  tracked,
  counts: {
    existing_files: tracked.filter((item) => item.exists).length,
    missing_files: tracked.filter((item) => !item.exists).length,
    intake_total: intake.count ?? 0,
    ready_for_review: intake.ready_for_review ?? 0,
    waiting_for_file: intake.waiting_for_file ?? 0,
    preview_checks: preview.checks?.length ?? 0,
    assembly_blockers: assembly.blockers?.length ?? 0
  },
  status: assembly.ready_for_assembly
    ? 'ready_for_assembly'
    : (intake.waiting_for_file ?? 0) > 0
      ? 'waiting_for_assets'
      : (intake.ready_for_review ?? 0) > 0
        ? 'ready_for_review'
        : 'planned',
  next_step: 'Use this overview to decide whether to create assets, review assets, or continue assembly.'
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(overview, null, 2), 'utf8');

console.log('wrote outputs/pilot/status/ep001_pipeline_overview.json');
console.log(`Status: ${overview.status}`);
console.log(`Existing files: ${overview.counts.existing_files}/${tracked.length}`);
