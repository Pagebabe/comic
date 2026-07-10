import { readFile, access } from 'node:fs/promises';
const required = ['index.html', 'app.js', 'styles.css', 'api/bot.mjs', 'lib/context.mjs', 'project/project.json', 'vercel.json'];
for (const file of required) await access(new URL(`../${file}`, import.meta.url));
const project = JSON.parse(await readFile(new URL('../project/project.json', import.meta.url), 'utf8'));
if (project.activeMilestone !== 'M1') throw new Error('Active milestone must be M1.');
if (project.characters.length < 2) throw new Error('At least two characters are required.');
if (project.milestones[0].state !== 'done') throw new Error('M0 must be complete.');
if (!project.milestones.some((item) => item.state === 'active')) throw new Error('One active milestone is required.');
console.log('Comic Factory checks passed.');
