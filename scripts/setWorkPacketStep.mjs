import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const selector = args[0];
const status = args[1];
const note = args.slice(2).join(' ');
const allowed = new Set(['open', 'done', 'blocked']);
const progressPath = join(root, 'outputs', 'pilot', 'work-packet', 'ep001_work_packet_progress.json');

if (!selector || !status) {
  console.error('Usage: npm run work:step -- step_02 done "registered candidate"');
  console.error('Allowed status: open, done, blocked');
  process.exit(1);
}

if (!allowed.has(status)) {
  console.error(`Invalid status: ${status}`);
  process.exit(1);
}

if (!existsSync(progressPath)) {
  console.error('Progress file not found. Run npm run create:work-progress first.');
  process.exit(1);
}

const progress = JSON.parse(readFileSync(progressPath, 'utf8'));
const step = (progress.steps ?? []).find((item) => item.id === selector || String(item.order) === selector || item.command.includes(selector));

if (!step) {
  console.error(`Step not found: ${selector}`);
  process.exit(1);
}

step.status = status;
step.note = note || step.note || '';
step.updated_at = new Date().toISOString();

const done = progress.steps.filter((item) => item.status === 'done').length;
const open = progress.steps.filter((item) => item.status === 'open').length;
const blocked = progress.steps.filter((item) => item.status === 'blocked').length;
const overallStatus = blocked > 0 ? 'blocked' : done === progress.steps.length ? 'done' : 'open';

progress.counts = {
  total: progress.steps.length,
  done,
  open,
  blocked
};
progress.overall_status = overallStatus;
progress.current_step = progress.steps.find((item) => item.status !== 'done') ?? null;
progress.next_command = progress.current_step?.command ?? 'npm run studio:next';
progress.updated_at = new Date().toISOString();

writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf8');
console.log(`updated ${step.id} -> ${status}`);
console.log(`Progress: ${done}/${progress.steps.length}`);
console.log(`Status: ${overallStatus}`);
console.log(`Next: ${progress.next_command}`);
