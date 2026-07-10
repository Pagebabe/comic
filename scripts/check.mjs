import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const required = [
  'index.html',
  'app.js',
  'styles.css',
  'api/bot.mjs',
  'api/health.mjs',
  'lib/context.mjs',
  'lib/browser-director.mjs',
  'project/project.json',
  'vercel.json',
  '.github/workflows/pages.yml',
  'tests/bot.test.mjs',
  'tests/browser-director.test.mjs'
];

for (const file of required) await access(new URL(`../${file}`, import.meta.url));

const project = JSON.parse(await readFile(new URL('../project/project.json', import.meta.url), 'utf8'));
const active = project.milestones.filter((item) => item.state === 'active');
if (project.activeMilestone !== 'M1') throw new Error('Active milestone must be M1.');
if (project.characters.length < 2) throw new Error('At least two characters are required.');
if (project.milestones[0].state !== 'done') throw new Error('M0 must be complete.');
if (active.length !== 1 || active[0].id !== project.activeMilestone) throw new Error('Exactly one matching active milestone is required.');
if (project.m1Tasks.length < 4) throw new Error('M1 needs a concrete task list.');

for (const file of ['app.js', 'api/bot.mjs', 'api/health.mjs', 'lib/context.mjs', 'lib/browser-director.mjs', 'scripts/check.mjs', 'tests/bot.test.mjs', 'tests/browser-director.test.mjs']) {
  const result = spawnSync(process.execPath, ['--check', new URL(`../${file}`, import.meta.url).pathname], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Syntax check failed for ${file}: ${result.stderr}`);
}

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
for (const marker of ['id="metrics"', 'id="timeline"', 'id="chat"', 'id="characters"', 'id="tasks"', 'id="systemStatus"', 'id="apiUrl"']) {
  if (!index.includes(marker)) throw new Error(`Dashboard marker missing: ${marker}`);
}
for (const relativeAsset of ['href="./styles.css"', 'src="./app.js"']) {
  if (!index.includes(relativeAsset)) throw new Error(`GitHub Pages relative asset missing: ${relativeAsset}`);
}

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
if (!app.includes("from './lib/browser-director.mjs'")) throw new Error('Browser director fallback is not wired into app.js.');
if (!app.includes("new URL('./project/project.json', import.meta.url)")) throw new Error('Project data path is not GitHub Pages safe.');

const pagesWorkflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
for (const marker of ['actions/configure-pages', 'actions/upload-pages-artifact', 'actions/deploy-pages', '_site/lib']) {
  if (!pagesWorkflow.includes(marker)) throw new Error(`Pages workflow marker missing: ${marker}`);
}

const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const securityHeaders = JSON.stringify(vercel.headers || []);
for (const header of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy']) {
  if (!securityHeaders.includes(header)) throw new Error(`Security header missing: ${header}`);
}

console.log('Comic Factory checks passed: project state, syntax, security, GitHub Pages assets and browser director fallback.');
