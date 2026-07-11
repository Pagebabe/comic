import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_GENERATED_AT,
  buildMigrationPreview,
  migrationPreviewToCsv,
  renderMigrationPreviewHtml,
  validateMigrationPreview,
  waitingPreview
} from '../lib/legacy-asset-migration.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const inventoryPath = resolve(root, valueAfter('--inventory', '_recovery_reports/asset-recovery-inventory.json'));
const shortlistPath = resolve(root, valueAfter('--shortlist', '_recovery_reports/analysis/visual-candidate-shortlist.json'));
const contractPath = resolve(root, valueAfter('--contract', 'project/legacy-asset-migration-contract.json'));
const outputDirectory = resolve(root, valueAfter('--output', 'output/legacy-asset-migration'));
const studioOutputPath = resolve(root, valueAfter('--studio-output', 'studio-app/public/legacy-asset-migration-preview.json'));
const generatedAt = valueAfter('--generated-at', process.env.LEGACY_MIGRATION_GENERATED_AT || DEFAULT_GENERATED_AT);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function runLegacyAssetMigrationPreview(options = {}) {
  const resolvedInventory = options.inventoryPath ? resolve(options.inventoryPath) : inventoryPath;
  const resolvedShortlist = options.shortlistPath ? resolve(options.shortlistPath) : shortlistPath;
  const resolvedContract = options.contractPath ? resolve(options.contractPath) : contractPath;
  const resolvedOutput = options.outputDirectory ? resolve(options.outputDirectory) : outputDirectory;
  const resolvedStudio = options.studioOutputPath === false
    ? null
    : resolve(options.studioOutputPath || studioOutputPath);
  const timestamp = options.generatedAt || generatedAt;

  const contract = await readJson(resolvedContract);
  const inventoryPresent = await exists(resolvedInventory);
  const shortlistPresent = await exists(resolvedShortlist);
  const missingInputs = [];
  if (!inventoryPresent) missingInputs.push('inventory');
  if (!shortlistPresent) missingInputs.push('shortlist');

  const preview = missingInputs.length
    ? waitingPreview(contract, missingInputs, timestamp)
    : await buildMigrationPreview({
      inventory: await readJson(resolvedInventory),
      shortlist: await readJson(resolvedShortlist),
      contract,
      generatedAt: timestamp,
      pathInspector: options.pathInspector
    });

  validateMigrationPreview(preview, contract);
  await mkdir(resolvedOutput, { recursive: true });
  const jsonPath = resolve(resolvedOutput, 'migration-preview.json');
  const csvPath = resolve(resolvedOutput, 'migration-preview.csv');
  const htmlPath = resolve(resolvedOutput, 'migration-preview.html');
  await writeFile(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  await writeFile(csvPath, migrationPreviewToCsv(preview), 'utf8');
  await writeFile(htmlPath, renderMigrationPreviewHtml(preview), 'utf8');

  if (resolvedStudio) {
    await mkdir(dirname(resolvedStudio), { recursive: true });
    await writeFile(resolvedStudio, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  }

  return Object.freeze({
    preview,
    paths: { jsonPath, csvPath, htmlPath, studioOutputPath: resolvedStudio },
    input: { inventoryPath: resolvedInventory, shortlistPath: resolvedShortlist, inventoryPresent, shortlistPresent },
    sourceMutationPerformed: false
  });
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    const result = await runLegacyAssetMigrationPreview();
    console.log(JSON.stringify({
      status: 'pass',
      state: result.preview.state,
      records: result.preview.summary.records,
      automaticMasterApprovals: result.preview.summary.automaticMasterApprovals,
      previewHash: result.preview.previewHash,
      input: result.input,
      paths: result.paths,
      sourceMutationPerformed: false
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'blocked', error: String(error?.message || error) }));
    process.exitCode = 1;
  }
}
