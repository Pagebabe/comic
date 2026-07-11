import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inspectRecoveryCase, sha256, validateDrillManifest } from '../lib/operator-readiness.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const parseArgs = (argv) => {
  const options = {
    manifest: 'project/operator-recovery-drills-v1.json',
    output: null,
    at: new Date().toISOString()
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--all') continue;
    if (arg === '--manifest') options.manifest = argv[++index];
    else if (arg === '--output') options.output = argv[++index];
    else if (arg === '--at') options.at = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
};

const fixtureForScenario = (scenario, scenarioRoot) => {
  switch (scenario.kind) {
    case 'missing_required_file':
      return { requiredFileExists: false, scenarioRoot };
    case 'invalid_json': {
      const path = join(scenarioRoot, 'damaged.json');
      writeFileSync(path, '{"broken":');
      return { jsonText: readFileSync(path, 'utf8'), scenarioRoot };
    }
    case 'commit_mismatch':
      return { expectedCommit: 'expected-commit', actualCommit: 'wrong-commit', scenarioRoot };
    case 'restore_source_equals_target': {
      const path = join(scenarioRoot, 'only-copy.json');
      writeFileSync(path, '{"safe":true}\n');
      return { restoreSource: path, restoreTarget: path, scenarioRoot };
    }
    case 'optional_tool_missing':
      return { optionalToolAvailable: false, scenarioRoot };
    default:
      throw new Error(`Unsupported scenario: ${scenario.kind}`);
  }
};

export function runRecoveryDrills({ manifestPath, outputPath = null, generatedAt = new Date().toISOString(), temporaryBase = tmpdir() } = {}) {
  const selectedManifest = manifestPath ?? 'project/operator-recovery-drills-v1.json';
  const manifest = validateDrillManifest(JSON.parse(readFileSync(resolve(repositoryRoot, selectedManifest), 'utf8')));
  const root = mkdtempSync(join(resolve(temporaryBase), 'comic-operator-drill-'));
  const results = [];
  try {
    for (const scenario of manifest.scenarios) {
      const scenarioRoot = join(root, scenario.id);
      mkdirSync(scenarioRoot, { recursive: true });
      const fixture = fixtureForScenario(scenario, scenarioRoot);
      const result = inspectRecoveryCase(scenario, fixture);
      results.push(Object.freeze({ ...result, fixtureScope: 'TEMPORARY_ONLY' }));
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  const core = Object.freeze({
    schemaVersion: 1,
    manifestId: manifest.id,
    mode: manifest.mode,
    status: results.every((result) => result.drillStatus === 'PASS') ? 'PASS' : 'FAIL',
    scenarioCount: results.length,
    passed: results.filter((result) => result.drillStatus === 'PASS').length,
    results: Object.freeze(results),
    temporaryFixtureRemoved: true,
    projectFilesModified: false,
    liveActionsExecuted: false,
    notProven: manifest.notProven
  });
  const report = Object.freeze({
    ...core,
    generatedAt,
    evidenceHash: sha256(core)
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
    const report = runRecoveryDrills({
      manifestPath: options.manifest,
      outputPath: options.output,
      generatedAt: options.at
    });
    console.log(JSON.stringify({
      status: report.status,
      scenarios: report.scenarioCount,
      passed: report.passed,
      evidenceHash: report.evidenceHash,
      projectFilesModified: report.projectFilesModified,
      liveActionsExecuted: report.liveActionsExecuted
    }));
    if (report.status !== 'PASS') process.exitCode = 1;
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
