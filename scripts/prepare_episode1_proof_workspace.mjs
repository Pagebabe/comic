import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [workspaceArg, sourceArg] = process.argv.slice(2);
if (!workspaceArg || !sourceArg) {
  throw new Error('Usage: node scripts/prepare_episode1_proof_workspace.mjs <archive-worktree> <worker-source>');
}

const workspace = path.resolve(workspaceArg);
const source = path.resolve(sourceArg);

const copies = [
  ['tests/episode1-proof/episode1-production.spec.ts', 'tests/e2e/episode1-production.spec.ts'],
  ['tests/episode1-proof/episode1.playwright.config.ts', 'tests/e2e/episode1.playwright.config.ts'],
  ['scripts/episode1-proof/episode1ProofLint.mjs', 'scripts/episode1ProofLint.mjs'],
  ['testdata/episode1/episode1-test-dataset.json', 'tests/fixtures/episode1-test-dataset.json']
];

for (const [from, to] of copies) {
  const destination = path.join(workspace, to);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(source, from), destination);
}

const packagePath = path.join(workspace, 'package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  lint: 'node scripts/episode1ProofLint.mjs',
  typecheck: 'tsc -b --pretty false',
  test: 'playwright test tests/e2e/episode1-production.spec.ts --config tests/e2e/episode1.playwright.config.ts'
};
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(JSON.stringify({
  status: 'prepared',
  workspace,
  source,
  archiveCommit: '7266cf8df99ad811904933189666bbb827bd3ad1',
  copiedFiles: copies.map(([, to]) => to),
  scripts: ['npm run lint', 'npm run typecheck', 'npm test', 'npm run build']
}, null, 2));
