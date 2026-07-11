import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runnerPath = new URL('../scripts/run_local_asset_recovery.sh', import.meta.url);
const runner = await readFile(runnerPath, 'utf8');

test('local asset recovery runner is fail-fast and read-only by contract', () => {
  assert.match(runner, /set -euo pipefail/);
  assert.doesNotMatch(runner, /(^|\n)\s*(rm|mv|cp)\s+/m);
  assert.match(runner, /SOURCE_ASSETS_MODIFIED: false/);
  assert.match(runner, /AUTOMATIC_MASTER_APPROVALS: 0/);
});

test('runner includes image, input and real LoRA model roots', () => {
  assert.match(runner, /ComfyUI\/output/);
  assert.match(runner, /ComfyUI\/input/);
  assert.match(runner, /ComfyUI\/models\/loras/);
  assert.match(runner, /stable-diffusion-webui\/models\/Lora/);
  assert.match(runner, /Downloads/);
  assert.match(runner, /Pictures/);
});

test('runner creates isolated reports and executes both recovery stages', () => {
  assert.match(runner, /_recovery_reports\/run-\$TIMESTAMP/);
  assert.match(runner, /report directory already exists/);
  assert.match(runner, /ZIP path already exists/);
  assert.match(runner, /recover_assets\.py/);
  assert.match(runner, /analyze_recovery_inventory\.py/);
  assert.match(runner, /visual-candidate-shortlist\.json/);
  assert.match(runner, /zip -rq/);
});

test('runner supports dry-run and explicit extra roots', () => {
  assert.match(runner, /--dry-run/);
  assert.match(runner, /--root/);
  assert.match(runner, /DRY_RUN_COMPLETE: no reports written/);
});
