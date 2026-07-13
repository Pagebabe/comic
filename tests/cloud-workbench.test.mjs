import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { validateCloudWorkbench } from '../scripts/check_cloud_workbench.mjs';
import './cloud-character-review.test.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..');

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'comic-cloud-workbench-'));
  fs.mkdirSync(path.join(root, '.devcontainer'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.copyFileSync(
    path.join(REPO_ROOT, '.devcontainer', 'devcontainer.json'),
    path.join(root, '.devcontainer', 'devcontainer.json'),
  );
  fs.copyFileSync(
    path.join(REPO_ROOT, 'scripts', 'cloud_workbench_setup.sh'),
    path.join(root, 'scripts', 'cloud_workbench_setup.sh'),
  );
  return root;
}

test('cloud workbench contract passes on repository configuration', () => {
  const result = validateCloudWorkbench(REPO_ROOT);
  assert.equal(result.status, 'CLOUD_WORKBENCH_CONTRACT_PASS');
  assert.equal(result.localMacRequired, false);
  assert.deepEqual(result.forwardedPorts, [3100]);
  assert.equal(result.destructiveCommands, 0);
});

test('cloud workbench contract rejects missing Studio port', () => {
  const root = makeFixture();
  try {
    const configPath = path.join(root, '.devcontainer', 'devcontainer.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.forwardPorts = [];
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    assert.throws(() => validateCloudWorkbench(root), /Port 3100 fehlt/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('cloud workbench contract rejects destructive setup commands', () => {
  const root = makeFixture();
  try {
    const setupPath = path.join(root, 'scripts', 'cloud_workbench_setup.sh');
    fs.appendFileSync(setupPath, '\ngit reset --hard origin/main\n');
    assert.throws(() => validateCloudWorkbench(root), /verbotenes destruktives Kommando/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('cloud character review Python sanitizer contract passes', () => {
  const result = spawnSync(
    'python3',
    ['-m', 'unittest', 'tests/test_cloud_character_review_package.py', '-v'],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  assert.equal(
    result.status,
    0,
    `Python sanitizer tests failed:\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
});
