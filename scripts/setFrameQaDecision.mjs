import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const selector = args[0];
const decision = args[1];
const scoreArg = args[2];
const note = args.slice(3).join(' ');
const allowedDecisions = new Set(['approved_candidate', 'needs_fix', 'retry_with_stronger_prompt', 'discard']);

if (!selector || !decision) {
  console.error('Usage: npm run qa:set -- ep001_tv_009 approved_candidate 88 "clean frame"');
  console.error('Allowed decisions: approved_candidate, needs_fix, retry_with_stronger_prompt, discard');
  process.exit(1);
}

if (!allowedDecisions.has(decision)) {
  console.error(`Invalid decision: ${decision}`);
  process.exit(1);
}

const score = Number(scoreArg ?? 0);
if (!Number.isFinite(score) || score < 0 || score > 100) {
  console.error('Score must be a number from 0 to 100.');
  process.exit(1);
}

const qaPath = join(root, 'outputs', 'pilot', 'qa', 'ep001_frame_qa.json');
const registryPath = join(root, 'outputs', 'pilot', 'candidates', 'ep001_frame_candidates.json');

if (!existsSync(qaPath)) {
  console.error('QA report not found. Run npm run create:frame-qa first.');
  process.exit(1);
}

const qa = JSON.parse(readFileSync(qaPath, 'utf8'));
const qaItems = qa.qa_items ?? [];
const matchingQa = qaItems.filter((item) => item.candidate_id === selector || item.tv_shot_id === selector);

if (matchingQa.length === 0) {
  console.error(`No QA item found for: ${selector}`);
  process.exit(1);
}

const selectedQa = matchingQa
  .slice()
  .sort((a, b) => String(b.candidate_id ?? '').localeCompare(String(a.candidate_id ?? '')))[0];

selectedQa.manual_score = score;
selectedQa.manual_decision = decision;
selectedQa.manual_note = note;
selectedQa.decided_at = new Date().toISOString();
selectedQa.suggested_decision = decision;

if (Array.isArray(selectedQa.checks)) {
  selectedQa.checks = selectedQa.checks.map((check) => ({
    ...check,
    status: decision === 'approved_candidate' ? 'passed_by_manual_review' : 'flagged_by_manual_review',
    score: null,
    note: note || check.note || ''
  }));
}

writeFileSync(qaPath, JSON.stringify(qa, null, 2), 'utf8');

if (existsSync(registryPath)) {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  for (const candidate of registry.candidates ?? []) {
    if (candidate.id === selectedQa.candidate_id || candidate.tv_shot_id === selector) {
      candidate.status = decision;
      candidate.qa_score = score;
      candidate.qa_note = note;
      candidate.qa_decided_at = selectedQa.decided_at;
    }
  }
  registry.updated_at = selectedQa.decided_at;
  writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
}

const receiptPath = join(root, 'outputs', 'pilot', 'qa', 'ep001_frame_qa_decisions.json');
const receipt = existsSync(receiptPath)
  ? JSON.parse(readFileSync(receiptPath, 'utf8'))
  : { episode_id: 'ep001', decisions: [] };

receipt.decisions.push({
  id: `qa_decision_${selectedQa.tv_shot_id}_${Date.now()}`,
  episode_id: 'ep001',
  scene_id: selectedQa.scene_id,
  tv_shot_id: selectedQa.tv_shot_id,
  candidate_id: selectedQa.candidate_id,
  decision,
  score,
  note,
  decided_at: selectedQa.decided_at,
  next_commands: decision === 'approved_candidate'
    ? [`npm run promote:candidate -- ${selectedQa.candidate_id ?? selectedQa.tv_shot_id}`]
    : ['npm run create:frame-plan']
});

mkdirSync(dirname(receiptPath), { recursive: true });
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');

console.log(`QA decision set for ${selectedQa.tv_shot_id}`);
console.log(`decision ${decision}`);
console.log(`score ${score}`);
console.log(`receipt outputs/pilot/qa/ep001_frame_qa_decisions.json`);
