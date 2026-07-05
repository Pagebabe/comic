import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const packetPath = join(root, 'outputs', 'pilot', 'work-packet', 'ep001_next_work_packet.json');
const progressPath = join(root, 'outputs', 'pilot', 'work-packet', 'ep001_work_packet_progress.json');

if (!existsSync(packetPath)) {
  console.error('Next work packet not found. Run npm run create:work-packet first.');
  process.exit(1);
}

const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
const previous = existsSync(progressPath)
  ? JSON.parse(readFileSync(progressPath, 'utf8'))
  : null;
const previousByCommand = new Map((previous?.steps ?? []).map((step) => [step.command, step]));

const steps = (packet.workflow ?? []).map((command, index) => {
  const existing = previousByCommand.get(command);
  return {
    id: `step_${String(index + 1).padStart(2, '0')}`,
    order: index + 1,
    command,
    status: existing?.status ?? 'open',
    note: existing?.note ?? '',
    updated_at: existing?.updated_at ?? null
  };
});

const done = steps.filter((step) => step.status === 'done').length;
const blocked = steps.filter((step) => step.status === 'blocked').length;
const report = {
  id: 'work_packet_progress_v1',
  episode_id: packet.episode_id,
  created_at: new Date().toISOString(),
  packet_id: packet.id,
  shot: packet.shot,
  counts: {
    total: steps.length,
    done,
    open: steps.filter((step) => step.status === 'open').length,
    blocked
  },
  current_step: steps.find((step) => step.status !== 'done') ?? null,
  steps,
  next_command: steps.find((step) => step.status !== 'done')?.command ?? 'npm run studio:next'
};

mkdirSync(dirname(progressPath), { recursive: true });
writeFileSync(progressPath, JSON.stringify(report, null, 2), 'utf8');
console.log('wrote outputs/pilot/work-packet/ep001_work_packet_progress.json');
console.log(`Progress: ${done}/${steps.length}`);
if (report.current_step) console.log(`Next: ${report.current_step.command}`);
