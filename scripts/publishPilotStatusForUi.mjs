import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const sourcePath = join(root, 'outputs', 'status', 'pilot-production-status.json');
const targetPath = join(root, 'public', 'status', 'pilot-production-status.json');
const indexPath = join(root, 'public', 'status', 'index.json');

if (!existsSync(sourcePath)) {
  console.error('Missing outputs/status/pilot-production-status.json');
  console.error('Run first: node scripts/createPilotProductionStatus.mjs');
  process.exit(1);
}

mkdirSync(dirname(targetPath), { recursive: true });
copyFileSync(sourcePath, targetPath);

const status = JSON.parse(readFileSync(sourcePath, 'utf8'));
const index = {
  id: 'public_status_index',
  createdAt: new Date().toISOString(),
  files: [
    {
      id: status.id ?? 'pilot_production_status',
      path: '/status/pilot-production-status.json',
      panelCount: status.panelCount ?? 0,
      counts: status.counts ?? {}
    }
  ]
};

writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

console.log('published public/status/pilot-production-status.json');
console.log('published public/status/index.json');
console.log(`panels: ${status.panelCount ?? 0}`);
