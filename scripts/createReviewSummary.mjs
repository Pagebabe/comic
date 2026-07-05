import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import template from '../src/data/reviewSummaryTemplate.json' assert { type: 'json' };

const root = process.cwd();
const decisionPath = join(root, template.decision_source);
const outPath = join(root, template.summary_output);

const decisionReport = existsSync(decisionPath)
  ? JSON.parse(readFileSync(decisionPath, 'utf8'))
  : { episode_id: 'ep001', decisions: [] };

const latestByShot = new Map();
for (const decision of decisionReport.decisions ?? []) {
  latestByShot.set(decision.tv_shot_id, decision);
}

const items = tvReviewQueue.map((item) => {
  const latest = latestByShot.get(item.tv_shot_id);
  return {
    tv_shot_id: item.tv_shot_id,
    scene_id: item.scene_id,
    title: item.title,
    base_status: item.status,
    current_status: latest?.status ?? item.status,
    asset_path: latest?.asset_path ?? item.asset_target,
    note: latest?.note ?? item.known_issue,
    decided_at: latest?.decided_at ?? null
  };
});

const counts = items.reduce((acc, item) => {
  acc[item.current_status] = (acc[item.current_status] ?? 0) + 1;
  return acc;
}, {});

const summary = {
  id: template.id,
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  total: items.length,
  decisions_logged: decisionReport.decisions?.length ?? 0,
  counts,
  blockers: items.filter((item) => item.current_status !== 'approved'),
  items,
  next_step: (counts.approved ?? 0) === items.length ? 'All shots approved. Recreate assembly package.' : 'Continue replacing or approving blocked shots.'
};

mkdirSync(join(root, 'outputs', 'pilot', 'status'), { recursive: true });
writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');

console.log(`wrote ${template.summary_output}`);
console.log(`Approved: ${counts.approved ?? 0}/${items.length}`);
console.log(`Blockers: ${summary.blockers.length}`);
