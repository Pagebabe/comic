import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { platform, arch } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateDoctor, sha256, validateEnvironmentManifest } from '../lib/operator-readiness.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const parseArgs = (argv) => {
  const options = {
    manifest: 'project/operator-environment-v1.json',
    output: null,
    at: new Date().toISOString()
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--manifest') options.manifest = argv[++index];
    else if (arg === '--output') options.output = argv[++index];
    else if (arg === '--at') options.at = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
};

const commandObservation = (command) => {
  const result = spawnSync(command.executable, command.args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    timeout: 15000
  });
  if (result.error || result.status !== 0) {
    return Object.freeze({ available: false, version: null, exitCode: result.status ?? null });
  }
  const version = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim().split('\n')[0] ?? '';
  return Object.freeze({ available: true, version, exitCode: 0 });
};

const fileObservation = (file) => {
  const absolute = resolve(repositoryRoot, file.path);
  if (!absolute.startsWith(`${repositoryRoot}/`) && absolute !== repositoryRoot) {
    return Object.freeze({ exists: false, valid: false, pathEscapeRejected: true });
  }
  if (!existsSync(absolute)) return Object.freeze({ exists: false, valid: false });
  const content = readFileSync(absolute);
  let valid = true;
  if (file.kind === 'json') {
    try {
      JSON.parse(content.toString('utf8'));
    } catch {
      valid = false;
    }
  }
  return Object.freeze({
    exists: true,
    valid,
    sha256: sha256(content),
    bytes: content.byteLength
  });
};

const gitCommit = () => {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8', timeout: 15000 });
  if (result.error || result.status !== 0) return 'UNKNOWN_COMMIT';
  return result.stdout.trim();
};

export function runOperatorDoctor({ manifestPath, outputPath = null, generatedAt = new Date().toISOString() } = {}) {
  const selectedManifest = manifestPath ?? 'project/operator-environment-v1.json';
  const manifest = validateEnvironmentManifest(JSON.parse(readFileSync(resolve(repositoryRoot, selectedManifest), 'utf8')));
  const observations = {
    platform: { os: platform(), arch: arch() },
    commands: Object.fromEntries(manifest.commands.map((command) => [command.id, commandObservation(command)])),
    files: Object.fromEntries(manifest.files.map((file) => [file.path, fileObservation(file)]))
  };
  const report = evaluateDoctor({
    manifest,
    observations,
    generatedAt,
    cwd: repositoryRoot,
    gitCommit: gitCommit()
  });
  if (outputPath) {
    const absoluteOutput = resolve(repositoryRoot, outputPath);
    mkdirSync(dirname(absoluteOutput), { recursive: true });
    writeFileSync(absoluteOutput, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = runOperatorDoctor({
      manifestPath: options.manifest,
      outputPath: options.output,
      generatedAt: options.at
    });
    console.log(JSON.stringify({
      status: report.status,
      platform: report.platform,
      blockers: report.blockers.length,
      warnings: report.warnings.length,
      evidenceHash: report.evidenceHash,
      liveActionsExecuted: false
    }));
    if (report.status === 'BLOCKED') process.exitCode = 1;
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
