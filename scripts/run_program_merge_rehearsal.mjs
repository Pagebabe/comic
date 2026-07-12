import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { runGitProbe } from './check_program_merge_readiness.mjs';

const args = process.argv.slice(2);
const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const manifestPath = resolve(valueAfter('--manifest') || 'project/program-merge-readiness.json');
const outputPath = resolve(valueAfter('--output') || 'output/program-merge-rehearsal.json');

try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await mkdir(dirname(outputPath), { recursive: true });
  const proof = await runGitProbe(manifest, outputPath);
  console.log(JSON.stringify(proof, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
