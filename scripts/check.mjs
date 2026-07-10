import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const required = [
  'index.html',
  'app.js',
  'styles.css',
  'api/bot.mjs',
  'api/health.mjs',
  'lib/context.mjs',
  'project/project.json',
  'vercel.json',
  'tests/bot.test.mjs'
];

for (const file of required) await access(new URL(`../${file}`, import.meta.url));

const project = JSON.parse(await readFile(new URL('../project/project.json', import.meta.url), 'utf8'));
const active = project.milestones.filter((item) => item.state === 'active');
if (project.activeMilestone !== 'M1') throw new Error('Active milestone must be M1.');
if (project.characters.length < 2) throw new Error('At least two characters are required.');
if (project.milestones[0].state !== 'done') throw new Error('M0 must be complete.');
if (active.length !== 1 || active[0].id !== project.activeMilestone) throw new Error('Exactly one matching active milestone is required.');
if (project.m1Tasks.length < 4) throw new Error('M1 needs a concrete task list.');

for (const file of ['app.js', 'api/bot.mjs', 'api/health.mjs', 'lib/context.mjs', 'scripts/check.mjs', 'tests/bot.test.mjs']) {
  const result = spawnSync(process.execPath, ['--check', new URL(`../${file}`, import.meta.url).pathname], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Syntax check failed for ${file}: ${result.stderr}`);
}

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
for (const marker of ['id="metrics"', 'id="timeline"', 'id="chat"', 'id="characters"', 'id="tasks"', 'id="systemStatus"']) {
  if (!index.includes(marker)) throw new Error(`Dashboard marker missing: ${marker}`);
}

const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const securityHeaders = JSON.stringify(vercel.headers || []);
for (const header of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy']) {
  if (!securityHeaders.includes(header)) throw new Error(`Security header missing: ${header}`);
}

console.log('Comic Factory checks passed: files, project state, syntax, dashboard markers and security headers.');
