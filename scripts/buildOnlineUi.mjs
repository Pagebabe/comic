import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function writeJsonIfMissing(relativePath, value) {
  const path = join(root, relativePath);
  if (existsSync(path)) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf8');
  console.log(`created ${relativePath}`);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    console.error(`failed: ${command} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

writeJsonIfMissing('outputs/comfyui/pilot/pilot-history-report.json', {
  id: 'online_empty_pilot_history_report',
  mode: 'online_placeholder',
  createdAt: new Date().toISOString(),
  results: [],
  nextStep: 'Run real ComfyUI renders locally, then publish review assets.'
});

writeJsonIfMissing('outputs/comfyui/pilot/pilot-render-status.json', {
  id: 'online_empty_pilot_render_status',
  mode: 'online_placeholder',
  createdAt: new Date().toISOString(),
  items: []
});

run('node', ['scripts/refreshPilotUi.mjs']);
run('node', ['scripts/writePilotUiStatus.mjs']);
run('npx', ['vite', 'build']);
