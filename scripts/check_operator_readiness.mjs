import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sha256, validateDrillManifest, validateEnvironmentManifest } from '../lib/operator-readiness.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(resolve(repositoryRoot, path), 'utf8'));

export function checkOperatorReadiness({ outputPath = 'output/operator/operator-contract-check.json' } = {}) {
  const environment = validateEnvironmentManifest(readJson('project/operator-environment-v1.json'));
  const drills = validateDrillManifest(readJson('project/operator-recovery-drills-v1.json'));
  const readiness = readJson('project/production-readiness-v1.json');
  const protocol = readFileSync(resolve(repositoryRoot, 'docs/NOVICE_ACCEPTANCE_PROTOCOL.md'), 'utf8');
  const runbookPath = resolve(repositoryRoot, 'docs/OPERATOR_INSTALL_AND_RECOVERY.md');
  if (!existsSync(runbookPath)) throw new Error('Operator install and recovery runbook is missing.');

  const byId = Object.fromEntries(readiness.gates.map((gate) => [gate.id, gate]));
  if (byId.PR1?.status !== 'PARTIAL') throw new Error('PR1 must remain PARTIAL until a second-person fresh installation drill exists.');
  if (byId.PR8?.status !== 'PARTIAL') throw new Error('PR8 must remain PARTIAL until a novice recovery observation exists.');
  if (byId.PR10?.status !== 'OPEN') throw new Error('PR10 must remain OPEN until the observed zero-knowledge acceptance run exists.');
  if (readiness.academyBoundary?.productionReady !== false) throw new Error('Production Ready must remain false.');
  if (readiness.academyBoundary?.beginnerReady !== false) throw new Error('Beginner Ready must remain false.');
  if (readiness.academyBoundary?.imageGenerationAllowed !== false) throw new Error('Image generation must remain blocked.');
  if (readiness.parallelLineBoundary?.growthOsIntegrated === true || readiness.parallelLineBoundary?.mainIntegrationAllowed !== false) {
    throw new Error('Growth OS must remain isolated from main.');
  }
  for (const requiredText of [
    'READY_TO_EXECUTE · NOT YET PASSED',
    'Automatisierte Tests beweisen technische Bedienbarkeit',
    '12/12 ohne undokumentierte Hilfe',
    '10/10 PRODUCTION_READY'
  ]) {
    if (!protocol.includes(requiredText)) throw new Error(`Novice protocol is missing required boundary: ${requiredText}`);
  }

  const core = {
    schemaVersion: 1,
    status: 'PASS',
    environmentManifest: environment.id,
    supportedPlatforms: environment.supportedPlatforms.map((item) => item.id),
    requiredCommands: environment.commands.filter((item) => item.required).map((item) => item.id),
    requiredFiles: environment.files.filter((item) => item.required).map((item) => item.path),
    drillManifest: drills.id,
    drillScenarios: drills.scenarios.map((item) => item.id),
    readiness: {
      PR1: byId.PR1.status,
      PR8: byId.PR8.status,
      PR10: byId.PR10.status,
      productionReady: readiness.academyBoundary.productionReady,
      beginnerReady: readiness.academyBoundary.beginnerReady,
      imageGenerationAllowed: readiness.academyBoundary.imageGenerationAllowed,
      growthOsIntegrated: readiness.academyBoundary.growthOsIntegrated
    },
    boundaries: {
      autoInstall: false,
      projectMutationByDoctor: false,
      realRecoveryData: false,
      creativeApproval: false,
      imageGeneration: false,
      growthIntegration: false,
      noviceAcceptanceClaimed: false
    }
  };
  const report = { ...core, evidenceHash: sha256(core) };
  const absoluteOutput = resolve(repositoryRoot, outputPath);
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  writeFileSync(absoluteOutput, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  try {
    const report = checkOperatorReadiness();
    console.log(JSON.stringify(report));
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
