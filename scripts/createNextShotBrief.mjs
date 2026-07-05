import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nextFixQueue from '../src/data/nextFixQueue.json' assert { type: 'json' };
import shot009Brief from '../src/data/shot009Brief.json' assert { type: 'json' };

const root = process.cwd();
const outDir = join(root, 'outputs', 'pilot', 'next');
const outPath = join(outDir, 'ep001_next_shot_brief.json');
const nextItem = [...nextFixQueue].sort((a, b) => a.priority - b.priority)[0];

const brief = nextItem?.tv_shot_id === shot009Brief.tv_shot_id
  ? shot009Brief
  : {
      id: `brief_${nextItem?.tv_shot_id ?? 'none'}`,
      episode_id: 'ep001',
      scene_id: nextItem?.scene_id ?? null,
      tv_shot_id: nextItem?.tv_shot_id ?? null,
      title: nextItem?.title ?? 'No next shot',
      target_path: nextItem?.output_target ?? null,
      goal: nextItem?.instruction ?? 'Fix queue is empty.',
      must_have: nextItem?.must_have ?? [],
      must_not_have: nextItem?.must_not_have ?? [],
      approval_checks: []
    };

const report = {
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  queue_item: nextItem ?? null,
  brief,
  next_step: brief.target_path ? `Create or place the image at ${brief.target_path}` : 'No target path.'
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote outputs/pilot/next/ep001_next_shot_brief.json');
console.log(`Next shot: ${brief.tv_shot_id ?? 'none'}`);
console.log(`Target: ${brief.target_path ?? 'none'}`);
