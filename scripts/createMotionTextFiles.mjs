import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const sourcePath = join(root, 'outputs', 'pilot', 'jobs', 'motion', 'ep001_motion_jobs.json');
const outDir = join(root, 'outputs', 'pilot', 'motion-text');
const indexPath = join(outDir, 'ep001_motion_text_index.json');

if (!existsSync(sourcePath)) {
  console.error('Missing outputs/pilot/jobs/motion/ep001_motion_jobs.json');
  console.error('Run npm run create:motion-jobs first.');
  process.exit(1);
}

const report = JSON.parse(readFileSync(sourcePath, 'utf8'));
mkdirSync(outDir, { recursive: true });

const entries = report.jobs.map((job) => {
  const base = `${String(job.priority).padStart(2, '0')}_${job.tv_shot_id}`;
  const textPath = join(outDir, `${base}.txt`);
  const metaPath = join(outDir, `${base}.json`);
  const text = [
    `SHOT: ${job.tv_shot_id}`,
    `TITLE: ${job.title}`,
    `STATUS: ${job.status}`,
    `SOURCE: ${job.source_keyframe ?? 'none'}`,
    `OUTPUT: ${job.output_target}`,
    `DURATION: ${job.duration_seconds}s`,
    `FPS: ${job.fps}`,
    `CAMERA: ${job.motion_plan.camera_move}`,
    `STRENGTH: ${job.motion_plan.motion_strength}`,
    '',
    job.prompt
  ].join('\n');

  const meta = {
    id: job.id,
    episode_id: job.episode_id,
    scene_id: job.scene_id,
    tv_shot_id: job.tv_shot_id,
    title: job.title,
    status: job.status,
    source_keyframe: job.source_keyframe,
    output_target: job.output_target,
    text_file: textPath.replace(`${root}/`, '')
  };

  writeFileSync(textPath, text, 'utf8');
  writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  return { ...meta, meta_file: metaPath.replace(`${root}/`, '') };
});

const index = {
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  count: entries.length,
  queued: entries.filter((item) => item.status === 'queued_for_motion').length,
  blocked: entries.filter((item) => item.status !== 'queued_for_motion').length,
  entries
};

writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
console.log('wrote outputs/pilot/motion-text/ep001_motion_text_index.json');
console.log(`Motion text files: ${entries.length}`);
