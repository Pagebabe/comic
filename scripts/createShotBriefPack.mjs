import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import shotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };
import nextFixQueue from '../src/data/nextFixQueue.json' assert { type: 'json' };

const root = process.cwd();
const outDir = join(root, 'outputs', 'pilot', 'next');
const outPath = join(outDir, 'ep001_remaining_shot_briefs.json');

const queueByShot = new Map(nextFixQueue.map((item) => [item.tv_shot_id, item]));
const briefs = shotBriefs
  .map((brief) => ({
    ...brief,
    queue_item: queueByShot.get(brief.tv_shot_id) ?? null,
    status: queueByShot.has(brief.tv_shot_id) ? 'active' : 'not_in_fix_queue'
  }))
  .sort((a, b) => a.priority - b.priority);

const pack = {
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  count: briefs.length,
  next_shot: briefs[0] ?? null,
  briefs,
  next_step: briefs[0]?.target_path ? `Create ${briefs[0].tv_shot_id} at ${briefs[0].target_path}` : 'No remaining briefs.'
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(pack, null, 2), 'utf8');

console.log('wrote outputs/pilot/next/ep001_remaining_shot_briefs.json');
console.log(`Briefs: ${briefs.length}`);
console.log(`Next: ${pack.next_shot?.tv_shot_id ?? 'none'}`);
