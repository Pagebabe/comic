import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('pages outcome watcher preserves a current rich deployment proof', async () => {
  const workflow = await readFile(new URL('../.github/workflows/pages-outcome.yml', import.meta.url), 'utf8');
  for (const marker of [
    'without overwriting rich proof',
    'richProofAlreadyCurrent',
    "online?.body?.includes('Runtime-Beweis:')",
    "online?.body?.includes('Beweiskettenabdeckung: 100%')",
    'if (!online)',
    'else if (!richProofAlreadyCurrent)'
  ]) {
    assert.ok(workflow.includes(marker), `missing marker: ${marker}`);
  }
  assert.equal(
    workflow.includes("if (existing) {\n              await github.rest.issues.update"),
    false,
    'old unconditional proof overwrite must not return'
  );
});
