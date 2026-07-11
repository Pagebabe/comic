import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

for (const path of [
  'studio-app/package.json',
  'studio-app/package-lock.json',
  'studio-app/tsconfig.json',
  'studio-app/vite.config.ts',
  'studio-app/index.html',
  'studio-app/src/main.tsx',
  'studio-app/src/App.tsx',
  'studio-app/src/styles.css',
  'studio-app/tests/browser-smoke.mjs',
  'project/studio-foundation-inventory.json',
  'project/studio-foundation-status.json',
  'docs/STUDIO_FOUNDATION_RECOVERY_2026-07-11.md'
]) await access(new URL(path, root));

const [inventory, status, pkg, app, vite] = await Promise.all([
  json('project/studio-foundation-inventory.json'),
  json('project/studio-foundation-status.json'),
  json('studio-app/package.json'),
  read('studio-app/src/App.tsx'),
  read('studio-app/vite.config.ts')
]);

if (inventory.repository !== 'Pagebabe/comic' || inventory.gate !== 'LR2' || inventory.trackingIssue !== 45) throw new Error('Studio inventory scope drifted.');
if (inventory.archive.branch !== 'archive/legacy-comic-2026-07-10' || inventory.archive.commit !== '7266cf8df99ad811904933189666bbb827bd3ad1') throw new Error('Archive source drifted.');
if (inventory.reviewedSources.find((entry) => entry.path === 'package-lock.json')?.decision !== 'reused_byte_for_byte') throw new Error('Archived lockfile provenance missing.');
if (inventory.reviewedSources.find((entry) => entry.path === 'package-lock.json')?.blob !== '89a83eabd5531903b1cb062c98bc00153ce25205') throw new Error('Archived lockfile blob changed.');
if (!inventory.explicitlyExcluded.includes('Package Export') || !inventory.explicitlyExcluded.includes('Growth OS and publishing automation')) throw new Error('LR2 exclusions are incomplete.');

if (status.status !== 'implementation_present_requires_public_proof' || status.gate !== 'LR2' || status.trackingIssue !== 45) throw new Error('Foundation status is not pending public LR2 proof.');
if (status.selectedPilot.id !== 'pilot-das-zimmer' || status.productionReady !== false) throw new Error('Pilot selection or production boundary drifted.');
if (status.automaticCanonApproval !== false || status.automaticVisualApproval !== false || status.automaticVoiceApproval !== false) throw new Error('Automatic creative approval was enabled.');
if (!Object.values(status.capabilities).every(Boolean)) throw new Error('Foundation capability contract is incomplete.');

if (pkg.name !== 'comic-factory' || pkg.scripts.build !== 'tsc -b && vite build') throw new Error('Archived build contract was not preserved.');
for (const dependency of ['react', 'react-dom', 'typescript', 'vite', '@vitejs/plugin-react']) if (!pkg.dependencies[dependency]) throw new Error(`Missing foundation dependency: ${dependency}`);
if (!vite.includes("base: './'")) throw new Error('Vite base must stay relative for the /studio/ Pages route.');

for (const marker of ['data-testid="studio-foundation"', 'project/truth-state.json', 'project/studio-foundation-status.json', 'Produktionsloop noch nicht gerettet']) if (!app.includes(marker)) throw new Error(`Studio app marker missing: ${marker}`);
for (const forbidden of ['RiccoStudio', 'RiccoPromptQueue', 'RiccoAssetImport', 'RiccoImageReview', 'RiccoPackage', 'RiccoRestore', 'ComfyUI']) if (app.includes(forbidden)) throw new Error(`LR3 module leaked into LR2: ${forbidden}`);

let distVerified = false;
try {
  const distIndex = await read('studio-app/dist/index.html');
  if (!distIndex.includes('<div id="root"></div>') || !/assets\/.+\.js/.test(distIndex)) throw new Error('Built studio index is invalid.');
  distVerified = true;
} catch (error) {
  if (process.argv.includes('--require-dist')) throw error;
}

console.log(JSON.stringify({
  status: 'pass',
  repository: inventory.repository,
  gate: inventory.gate,
  archiveCommit: inventory.archive.commit,
  reviewedSourceCount: inventory.reviewedSources.length,
  selectedSliceCapabilities: inventory.selectedSlice.capabilities.length,
  productionReady: status.productionReady,
  distVerified
}));
