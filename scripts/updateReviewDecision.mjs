import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };

const root = process.cwd();
const [status, shotId, assetPath, ...noteParts] = process.argv.slice(2);
const allowed = ['approved', 'needs_fix', 'queued'];

if (!allowed.includes(status) || !shotId) {
  console.error('Usage: npm run review:set -- approved ep001_tv_006 outputs/...png "note"');
  process.exit(1);
}

const item = tvReviewQueue.find((entry) => entry.tv_shot_id === shotId);
if (!item) {
  console.error(`Unknown tv_shot_id: ${shotId}`);
  process.exit(1);
}

const note = noteParts.join(' ') || null;
const decision = {
  decision_id: `decision_${shotId}_${Date.now()}`,
  episode_id: item.episode_id,
  scene_id: item.scene_id,
  tv_shot_id: shotId,
  status,
  asset_path: assetPath ?? item.asset_target,
  note,
  decided_at: new Date().toISOString()
};

const decisionDir = join(root, 'outputs', 'pilot', 'review-decisions');
const decisionPath = join(decisionDir, 'ep001_review_decisions.json');
mkdirSync(decisionDir, { recursive: true });

const existing = existsSync(decisionPath) ? JSON.parse(readFileSync(decisionPath, 'utf8')) : { episode_id: 'ep001', decisions: [] };
existing.decisions.push(decision);
writeFileSync(decisionPath, JSON.stringify(existing, null, 2), 'utf8');

const manifestPath = join(root, 'outputs', 'pilot', 'review', item.scene_id, 'review.manifest.json');
let manifest_updated = false;
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const target = manifest.items?.find?.((entry) => entry.tv_shot_id === shotId);
  if (target) {
    target.status = status;
    target.asset_target = decision.asset_path;
    target.review_notes = note;
    target.reviewed_at = decision.decided_at;
    manifest.updated_at = decision.decided_at;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    manifest_updated = true;
  }
}

console.log(`wrote outputs/pilot/review-decisions/ep001_review_decisions.json`);
console.log(`Decision: ${shotId} -> ${status}`);
console.log(`Manifest updated: ${manifest_updated}`);
