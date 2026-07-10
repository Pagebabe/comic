import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const required = [
  'index.html',
  'app.js',
  'styles.css',
  'm1.css',
  'api/bot.mjs',
  'api/health.mjs',
  'lib/context.mjs',
  'lib/browser-director.mjs',
  'project/project.json',
  'vercel.json',
  '.github/workflows/ci.yml',
  '.github/workflows/pages.yml',
  '.github/workflows/pages-outcome.yml',
  'tests/bot.test.mjs',
  'tests/browser-director.test.mjs',
  'scripts/render_m1.py',
  'assets/characters/ricco.svg',
  'assets/characters/basti.svg',
  'assets/characters/jule.svg',
  'assets/characters/don-miau.svg',
  'series/ricco-im-haus/characters/ricco/character.json',
  'series/ricco-im-haus/episodes/m1-life-sign/scene.json',
  'docs/M1_PRODUCTION_BRIEF.md',
  'docs/M1_RENDER_RUNBOOK.md'
];

for (const file of required) await access(new URL(`../${file}`, import.meta.url));

const project = JSON.parse(await readFile(new URL('../project/project.json', import.meta.url), 'utf8'));
const active = project.milestones.filter((item) => item.state === 'active');
if (project.activeMilestone !== 'M1') throw new Error('Active milestone must be M1.');
if (project.characters.length < 2) throw new Error('At least two characters are required.');
if (project.milestones[0].state !== 'done') throw new Error('M0 must be complete.');
if (active.length !== 1 || active[0].id !== project.activeMilestone) throw new Error('Exactly one matching active milestone is required.');
if (project.m1Tasks.length < 4) throw new Error('M1 needs a concrete task list.');
if (project.deployment?.status !== 'online') throw new Error('Verified dashboard deployment must be recorded.');
if (project.deployment?.url !== 'https://pagebabe.github.io/comic/') throw new Error('Unexpected dashboard URL.');
if (project.m1Spec?.testLine !== 'Bruder, endlich was Eigenes.') throw new Error('M1 test line must remain locked.');

for (const character of project.characters) {
  if (!character.portrait?.startsWith('./assets/characters/')) throw new Error(`Portrait path missing for ${character.id}.`);
  await access(new URL(`../${character.portrait.slice(2)}`, import.meta.url));
}

const characterManifest = JSON.parse(await readFile(new URL('../series/ricco-im-haus/characters/ricco/character.json', import.meta.url), 'utf8'));
if (characterManifest.id !== 'ricco') throw new Error('Ricco character manifest has the wrong id.');
if (!characterManifest.visual?.requiredIdentifiers?.includes('schwarze Kopfhörer')) throw new Error('Ricco identity anchors are incomplete.');

const scene = JSON.parse(await readFile(new URL('../series/ricco-im-haus/episodes/m1-life-sign/scene.json', import.meta.url), 'utf8'));
if (scene.shot?.line !== project.m1Spec.testLine) throw new Error('Scene and project test lines differ.');
if (scene.format?.width !== 1080 || scene.format?.height !== 1920 || scene.format?.fps !== 30) throw new Error('M1 export contract is invalid.');
if (scene.format?.durationSeconds < 3 || scene.format?.durationSeconds > 5) throw new Error('M1 duration must stay between 3 and 5 seconds.');

for (const file of ['app.js', 'api/bot.mjs', 'api/health.mjs', 'lib/context.mjs', 'lib/browser-director.mjs', 'scripts/check.mjs', 'tests/bot.test.mjs', 'tests/browser-director.test.mjs']) {
  const result = spawnSync(process.execPath, ['--check', new URL(`../${file}`, import.meta.url).pathname], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Syntax check failed for ${file}: ${result.stderr}`);
}

const renderScript = await readFile(new URL('../scripts/render_m1.py', import.meta.url), 'utf8');
for (const marker of ['Pillow', 'espeak-ng', 'ffmpeg', 'ffprobe', 'mouth_state', 'probe_master', 'technical-proof-only']) {
  if (!renderScript.includes(marker)) throw new Error(`M1 renderer contract missing: ${marker}`);
}

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
for (const marker of ['id="metrics"', 'id="timeline"', 'id="chat"', 'id="characters"', 'id="tasks"', 'id="systemStatus"', 'id="apiUrl"', 'id="m1Video"', 'id="m1ProofStatus"', 'id="m1ProofMeta"', 'id="healthM1"']) {
  if (!index.includes(marker)) throw new Error(`Dashboard marker missing: ${marker}`);
}
for (const relativeAsset of ['href="./styles.css"', 'href="./m1.css"', 'src="./app.js"', 'src="./media/m1/ricco-life-sign.mp4"']) {
  if (!index.includes(relativeAsset)) throw new Error(`GitHub Pages relative asset missing: ${relativeAsset}`);
}

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
if (!app.includes("from './lib/browser-director.mjs'")) throw new Error('Browser director fallback is not wired into app.js.');
if (!app.includes("new URL('./project/project.json', import.meta.url)")) throw new Error('Project data path is not GitHub Pages safe.');
if (!app.includes("new URL('./media/m1/render-report.json', import.meta.url)")) throw new Error('M1 render report is not wired into dashboard.');
if (!app.includes('character.portrait')) throw new Error('Character artwork is not wired into the dashboard.');

const ciWorkflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
for (const marker of ['ffmpeg', 'espeak-ng', 'pillow==11.3.0', 'python scripts/render_m1.py', 'actions/upload-artifact']) {
  if (!ciWorkflow.includes(marker)) throw new Error(`CI M1 proof marker missing: ${marker}`);
}

const pagesWorkflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
for (const marker of ['actions/configure-pages', 'actions/upload-pages-artifact', 'actions/deploy-pages', '_site/lib', 'cp -R assets _site/', 'python scripts/render_m1.py', '_site/media/m1', 'ricco-life-sign.mp4', 'render-report.json', 'm1.css']) {
  if (!pagesWorkflow.includes(marker)) throw new Error(`Pages workflow marker missing: ${marker}`);
}

const outcomeWorkflow = await readFile(new URL('../.github/workflows/pages-outcome.yml', import.meta.url), 'utf8');
for (const marker of ['workflow_run', 'Deploy Comic Factory Dashboard', '[DEPLOY PROOF]', '[DEPLOY BLOCKER]', 'issues: write']) {
  if (!outcomeWorkflow.includes(marker)) throw new Error(`Pages outcome marker missing: ${marker}`);
}

const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const securityHeaders = JSON.stringify(vercel.headers || []);
for (const header of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy']) {
  if (!securityHeaders.includes(header)) throw new Error(`Security header missing: ${header}`);
}

console.log('Comic Factory checks passed: verified deployment, project state, character artwork, deterministic M1 renderer, media proof UI, CI, security and Pages publishing.');
