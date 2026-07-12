import { spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { diagnoseFailure } from '../lib/operator-recovery.mjs';

function commandVersion(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', shell: false });
  return {
    available: result.status === 0,
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim()
  };
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function inspectOperatorEnvironment({ rootDirectory = process.cwd() } = {}) {
  const root = resolve(rootDirectory);
  const git = commandVersion('git', ['--version']);
  const npm = commandVersion('npm', ['--version']);
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const checks = {
    node: { available: Number.isFinite(nodeMajor), version: process.version, supported: nodeMajor >= 20 },
    npm,
    git,
    files: {
      rootPackage: await exists(resolve(root, 'package.json')),
      studioPackage: await exists(resolve(root, 'studio-app', 'package.json')),
      studioLockfile: await exists(resolve(root, 'studio-app', 'package-lock.json')),
      truthState: await exists(resolve(root, 'project', 'truth-state.json')),
      academyContract: await exists(resolve(root, 'project', 'production-academy.json')),
      readinessState: await exists(resolve(root, 'project', 'production-readiness-v1.json'))
    }
  };

  const failures = [];
  if (!checks.node.supported) failures.push(diagnoseFailure({ code: 'NODE_UNSUPPORTED', evidence: [checks.node.version] }));
  if (!checks.git.available) failures.push(diagnoseFailure({ code: 'GIT_MISSING', evidence: [checks.git.stderr || 'git unavailable'] }));
  if (!checks.files.studioLockfile) failures.push(diagnoseFailure({ code: 'STUDIO_LOCKFILE_MISSING', evidence: ['studio-app/package-lock.json'] }));
  if (!checks.files.truthState || !checks.files.academyContract || !checks.files.readinessState) {
    const missing = Object.entries(checks.files).filter(([, present]) => !present).map(([name]) => name);
    failures.push(diagnoseFailure({ code: 'PROJECT_TRUTH_MISSING', evidence: missing }));
  }

  return Object.freeze({
    schemaVersion: 1,
    repository: 'Pagebabe/comic',
    trackingIssue: 118,
    rootDirectory: root,
    checks,
    failures,
    status: failures.length ? 'BLOCKED' : 'READY_FOR_SAFE_DRILLS',
    mutationPerformed: false,
    productionReady: false,
    beginnerReady: false,
    creativeApprovalGranted: false,
    imageGenerationAllowed: false,
    growthOsIntegrated: false
  });
}

const invokedDirectly = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  const report = await inspectOperatorEnvironment({ rootDirectory: process.argv[2] || process.cwd() });
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'READY_FOR_SAFE_DRILLS') process.exitCode = 1;
}
