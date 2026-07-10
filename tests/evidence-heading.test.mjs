import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('dashboard evidence heading is drift-safe and contains no stale count', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Vollständige Regeln- und Claim-Klassifikation/);
  assert.doesNotMatch(html, /23\/23 Arbeitsregeln und Behauptungen/);
  assert.doesNotMatch(html, /<h2>\d+\/\d+ Arbeitsregeln und Behauptungen/);
});
