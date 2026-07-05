import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import template from '../src/data/assemblyGateTemplate.json' assert { type: 'json' };

const root = process.cwd();
const items = tvReviewQueue.map((item) => {
  const absoluteAssetPath = join(root, item.asset_target);
  const assetExists = existsSync(absoluteAssetPath);
  const approved = item.status === 'approved';
  const blockers = [];

  if (!approved) {
    blockers.push(`status:${item.status}`);
  }

  if (!assetExists) {
    blockers.push('asset_missing');
  }

  return {
    tv_shot_id: item.tv_shot_id,
    scene_id: item.scene_id,
    title: item.title,
    status: item.status,
    current_version: item.current_version,
    asset_target: item.asset_target,
    asset_exists: assetExists,
    ready_for_assembly: blockers.length === 0,
    blockers
  };
});

const ready = items.filter((item) => item.ready_for_assembly);
const blocked = items.filter((item) => !item.ready_for_assembly);

const report = {
  id: template.id,
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  total: items.length,
  ready_count: ready.length,
  blocked_count: blocked.length,
  ready_for_assembly: blocked.length === 0,
  ready,
  blocked,
  items,
  next_step: blocked.length === 0
    ? 'All keyframes are approved and present. Recreate assembly package and Remotion plan.'
    : 'Resolve blocked shots before assembly.'
};

const outputPath = join(root, template.output);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`wrote ${template.output}`);
console.log(`Ready: ${ready.length}/${items.length}`);
console.log(`Blocked: ${blocked.length}`);
console.log(`Assembly ready: ${report.ready_for_assembly}`);

if (!report.ready_for_assembly) {
  process.exitCode = 1;
}
