import { createHash } from 'node:crypto';
import { access, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve(process.argv[2] || 'output/episode1-proof');
const required = [
  'episode1-run-manifest.json',
  'episode1-production-package.json',
  'episode1-lettering-preview.pdf',
  'episode1-reconstruction-proof.json',
  'episode1-qa-pass.png',
  'episode1-export-ready.png',
  'episode1-lettering-preview.png',
  'command-results.json'
];

for (const file of required) {
  const target = path.join(outputDir, file);
  await access(target);
  if ((await stat(target)).size === 0) throw new Error(`[EPISODE1_PROOF:EMPTY] ${file}`);
}

const manifest = JSON.parse(await readFile(path.join(outputDir, 'episode1-run-manifest.json'), 'utf8'));
const pkg = JSON.parse(await readFile(path.join(outputDir, 'episode1-production-package.json'), 'utf8'));
const reconstruction = JSON.parse(await readFile(path.join(outputDir, 'episode1-reconstruction-proof.json'), 'utf8'));
const commands = JSON.parse(await readFile(path.join(outputDir, 'command-results.json'), 'utf8'));
const pdf = await readFile(path.join(outputDir, 'episode1-lettering-preview.pdf'));

if (manifest.status !== 'pass') throw new Error('[EPISODE1_PROOF:MANIFEST] status must be pass');
if (manifest.episode?.id !== 'ep_001' || manifest.episode?.title !== 'Das Zimmer' || manifest.episode?.panels !== 8) throw new Error('[EPISODE1_PROOF:EPISODE] wrong episode');
if (manifest.importedImages !== 9 || manifest.finalImages !== 8) throw new Error('[EPISODE1_PROOF:COUNTS] image counts drifted');
for (const field of ['creativeApprovalGranted', 'characterLockGranted', 'locationLockGranted', 'styleLockGranted', 'externalGenerationExecuted']) {
  if (manifest[field] !== false) throw new Error(`[EPISODE1_PROOF:BOUNDARY] ${field} must remain false`);
}
if (manifest.storageImplementationObserved !== 'localStorage_data_urls') throw new Error('[EPISODE1_PROOF:STORAGE] observed storage implementation not recorded honestly');

const requiredTransitions = [
  'episode_loaded','panel_order_verified','prompts_generated','missing_assets_detected','images_imported','images_survived_reload',
  'first_selection_made','selection_changed','all_final_images_selected','qa_passed','export_ready','lettering_preview_opened',
  'print_invoked','pdf_created','package_downloaded','project_reopened','state_cleared','package_restored','reconstructed_package_matched'
];
const transitionMap = new Map(manifest.transitions.map((item) => [item.id, item]));
for (const id of requiredTransitions) {
  if (transitionMap.get(id)?.status !== 'pass') throw new Error(`[EPISODE1_PROOF:TRANSITION] ${id}`);
}
if (transitionMap.get('manual_external_generation_handoff')?.status !== 'manual') throw new Error('[EPISODE1_PROOF:MANUAL] external generation handoff must be manual');

if (pkg.packageVersion !== 'ricco-production-package-v1') throw new Error('[EPISODE1_PROOF:PACKAGE_VERSION]');
if (pkg.episode?.id !== 'ep_001' || pkg.panels?.length !== 8) throw new Error('[EPISODE1_PROOF:PACKAGE_EPISODE]');
if (pkg.reviewState?.storedImages?.length !== 9 || pkg.reviewState?.finalImageCount !== 8 || pkg.reviewState?.exportReady !== true) throw new Error('[EPISODE1_PROOF:PACKAGE_STATE]');
if (!pkg.panels.every((panel) => panel.exportReady === true && panel.finalImage?.selected === true)) throw new Error('[EPISODE1_PROOF:FINAL_SELECTIONS]');
if (!pkg.reviewState.storedImages.every((image) => String(image.notes).startsWith('TEST ASSET ONLY') || String(image.notes).startsWith('Bulk Upload:'))) throw new Error('[EPISODE1_PROOF:TEST_LABELS]');

if (reconstruction.status !== 'pass' || reconstruction.originalNormalizedSha256 !== reconstruction.reconstructedNormalizedSha256) throw new Error('[EPISODE1_PROOF:RESTORE_HASH]');
if (reconstruction.storedImages !== 9 || reconstruction.finalImages !== 8 || reconstruction.exportReady !== true) throw new Error('[EPISODE1_PROOF:RESTORE_COUNTS]');
if (pdf.subarray(0, 4).toString() !== '%PDF') throw new Error('[EPISODE1_PROOF:PDF] invalid PDF header');

for (const command of ['npm run lint','npm run typecheck','npm test','npm run build']) {
  if (commands[command]?.status !== 'pass' || commands[command]?.exitCode !== 0) throw new Error(`[EPISODE1_PROOF:COMMAND] ${command}`);
}

const hashes = {};
for (const file of required) {
  const bytes = await readFile(path.join(outputDir, file));
  hashes[file] = createHash('sha256').update(bytes).digest('hex');
}
const summary = {
  schemaVersion: 1,
  status: 'pass',
  decision: 'EPISODE_PIPELINE_PROVEN',
  scope: 'technical test production with synthetic test images; no creative approval',
  episode: { id: 'ep_001', title: 'Das Zimmer', panels: 8 },
  sourceArchiveCommit: manifest.sourceArchiveCommit,
  importedImages: 9,
  finalImages: 8,
  restoredImages: 9,
  pdfBytes: pdf.length,
  normalizedPackageSha256: reconstruction.originalNormalizedSha256,
  commandResults: commands,
  hashes,
  creativeApprovalGranted: false,
  generatedAt: new Date().toISOString()
};
await writeFile(path.join(outputDir, 'episode1-proof-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
