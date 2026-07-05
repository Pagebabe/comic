import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const selector = args[0];
const noteFlagIndex = args.indexOf('--note');
const note = noteFlagIndex >= 0 ? args.slice(noteFlagIndex + 1).join(' ') : '';

if (!selector) {
  console.error('Usage: npm run promote:candidate -- ep001_tv_009');
  console.error('Or: npm run promote:candidate -- candidate_id');
  process.exit(1);
}

const registryPath = join(root, 'outputs', 'pilot', 'candidates', 'ep001_frame_candidates.json');
if (!existsSync(registryPath)) {
  console.error('Candidate registry not found. Run register:candidate first.');
  process.exit(1);
}

const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const candidates = registry.candidates ?? [];
const matching = candidates.filter((item) => item.id === selector || item.tv_shot_id === selector);

if (matching.length === 0) {
  console.error(`No candidate found for: ${selector}`);
  process.exit(1);
}

const candidate = matching
  .slice()
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

if (!candidate.official_target) {
  console.error(`Candidate has no official target: ${candidate.id}`);
  process.exit(1);
}

const sourcePath = join(root, candidate.candidate_file);
if (!existsSync(sourcePath)) {
  console.error(`Candidate file missing: ${candidate.candidate_file}`);
  process.exit(1);
}

const targetPath = join(root, candidate.official_target);
mkdirSync(dirname(targetPath), { recursive: true });
copyFileSync(sourcePath, targetPath);

const promotedAt = new Date().toISOString();
for (const item of candidates) {
  if (item.id === candidate.id) {
    item.status = 'promoted';
    item.promoted_target = candidate.official_target;
    item.promoted_at = promotedAt;
    item.promotion_note = note;
  }
}
registry.updated_at = promotedAt;
writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');

const receiptPath = join(root, 'outputs', 'pilot', 'candidates', 'ep001_candidate_promotions.json');
const receipt = existsSync(receiptPath)
  ? JSON.parse(readFileSync(receiptPath, 'utf8'))
  : { episode_id: 'ep001', promotions: [] };

receipt.promotions.push({
  id: `promotion_${candidate.tv_shot_id}_${Date.now()}`,
  episode_id: 'ep001',
  scene_id: candidate.scene_id,
  tv_shot_id: candidate.tv_shot_id,
  candidate_id: candidate.id,
  candidate_file: candidate.candidate_file,
  official_target: candidate.official_target,
  note,
  promoted_at: promotedAt,
  next_commands: [
    'npm run create:asset-intake',
    'npm run sync:asset-previews',
    'npm run create:review-summary',
    'npm run create:studio-status'
  ]
});

mkdirSync(dirname(receiptPath), { recursive: true });
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');

console.log(`promoted ${candidate.tv_shot_id}`);
console.log(`candidate ${candidate.candidate_file}`);
console.log(`target ${candidate.official_target}`);
console.log('next: npm run create:asset-intake && npm run sync:asset-previews');
