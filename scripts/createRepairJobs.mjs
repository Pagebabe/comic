import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import queue from '../src/data/nextFixQueue.json' assert { type: 'json' };

const root = process.cwd();
const outRoot = join(root, 'outputs', 'pilot', 'jobs', 'repairs');
const requestedId = process.argv[2];
const items = requestedId ? queue.filter((item) => item.id === requestedId) : queue;

if (requestedId && items.length === 0) {
  console.error(`Unknown item id: ${requestedId}`);
  process.exit(1);
}

mkdirSync(outRoot, { recursive: true });

const index = [];

for (const item of items) {
  const dir = join(outRoot, item.scene_id);
  mkdirSync(dir, { recursive: true });

  const job = {
    job_id: item.id,
    priority: item.priority,
    task_type: item.type,
    status: 'queued',
    episode_id: 'ep001',
    scene_id: item.scene_id,
    tv_shot_id: item.tv_shot_id,
    title: item.title,
    reason: item.reason,
    instruction: item.instruction,
    required: item.must_have,
    forbidden: item.must_not_have,
    output_target: item.output_target,
    review_target: `outputs/pilot/review/${item.scene_id}/review.manifest.json`
  };

  const relativePath = `outputs/pilot/jobs/repairs/${item.scene_id}/${item.id}.json`;
  writeFileSync(join(root, relativePath), JSON.stringify(job, null, 2), 'utf8');
  index.push({ id: item.id, priority: item.priority, path: relativePath });
}

writeFileSync(join(outRoot, 'index.json'), JSON.stringify({ episode_id: 'ep001', count: index.length, jobs: index }, null, 2), 'utf8');

console.log(`Created ${index.length} repair jobs.`);
index.forEach((item) => console.log(`- ${item.path}`));
