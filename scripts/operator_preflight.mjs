import { access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);

export const requiredFiles = [
  'package.json',
  'studio-app/package.json',
  'studio-app/package-lock.json',
  'project/production-readiness-v1.json',
  'project/novice-acceptance-template.json',
  'docs/NOVICE_ACCEPTANCE_PROTOCOL.md'
];

export const commandRequirements = [
  { id: 'npm', command: 'npm', args: ['--version'], minimumMajor: 9 },
  { id: 'git', command: 'git', args: ['--version'], minimumMajor: 2 },
  { id: 'python3', command: 'python3', args: ['--version'], minimumMajor: 3 },
  { id: 'ffmpeg', command: 'ffmpeg', args: ['-version'], minimumMajor: null },
  { id: 'espeak-ng', command: 'espeak-ng', args: ['--version'], minimumMajor: null }
];

export const parseMajor = (value) => {
  const match = String(value ?? '').match(/(\d+)(?:\.\d+)?/);
  return match ? Number(match[1]) : null;
};

const defaultCommandRunner = ({ command, args }) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return {
    exitCode: result.status ?? 1,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim(),
    error: result.error?.message ?? null
  };
};

const defaultFileChecker = async (path) => {
  try {
    await access(new URL(path, root));
    return true;
  } catch {
    return false;
  }
};

export async function runOperatorPreflight({
  commandRunner = defaultCommandRunner,
  fileChecker = defaultFileChecker,
  platform = process.platform,
  architecture = process.arch,
  nodeVersion = process.version
} = {}) {
  const checks = [];
  const supportedPlatform = platform === 'darwin' || platform === 'linux';
  checks.push({
    id: 'platform',
    status: supportedPlatform ? 'PASS' : 'FAIL',
    observed: `${platform}/${architecture}`,
    requirement: 'darwin or linux reference profile'
  });

  const nodeMajor = parseMajor(nodeVersion);
  checks.push({
    id: 'node',
    status: nodeMajor !== null && nodeMajor >= 20 ? 'PASS' : 'FAIL',
    observed: nodeVersion,
    requirement: 'Node.js >= 20'
  });

  for (const requirement of commandRequirements) {
    const result = commandRunner(requirement);
    const major = parseMajor(result.output);
    const versionAccepted = requirement.minimumMajor === null
      || (major !== null && major >= requirement.minimumMajor);
    const passed = result.exitCode === 0 && versionAccepted;
    checks.push({
      id: requirement.id,
      status: passed ? 'PASS' : 'FAIL',
      observed: result.output || result.error || 'command unavailable',
      requirement: requirement.minimumMajor === null
        ? `${requirement.command} available`
        : `${requirement.command} major >= ${requirement.minimumMajor}`
    });
  }

  for (const path of requiredFiles) {
    const exists = await fileChecker(path);
    checks.push({
      id: `file:${path}`,
      status: exists ? 'PASS' : 'FAIL',
      observed: exists ? 'present' : 'missing',
      requirement: path
    });
  }

  const failedChecks = checks.filter((check) => check.status !== 'PASS');
  return {
    schemaVersion: 1,
    type: 'comic-factory-operator-preflight',
    status: failedChecks.length === 0 ? 'READY_FOR_OBSERVED_DRILL' : 'BLOCKED',
    platform,
    architecture,
    mutatingActionsPerformed: false,
    productionReady: false,
    beginnerReady: false,
    imageGenerationAllowed: false,
    growthOsIntegrated: false,
    checks,
    failedCheckIds: failedChecks.map((check) => check.id),
    nextAction: failedChecks.length === 0
      ? 'Run the observed install and novice drill with a second person.'
      : 'Resolve only the listed prerequisites, rerun this read-only preflight and record every change.'
  };
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const result = await runOperatorPreflight();
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'READY_FOR_OBSERVED_DRILL') process.exitCode = 1;
}
