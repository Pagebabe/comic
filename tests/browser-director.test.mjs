import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIssueDraft, callBrowserLlm, localCommandReply, validateBrowserProviderUrl } from '../lib/browser-director.mjs';

test('browser status reports M1R without a backend', () => {
  const result = localCommandReply('/status');
  assert.match(result.reply, /M1R Canon & Asset Recovery/);
  assert.match(result.reply, /Pipelinebeweis/);
});

test('browser character command exposes recovered inventory', () => {
  const result = localCommandReply('/characters');
  assert.match(result.reply, /13 Figuren/);
  assert.match(result.reply, /9 Character Production Sheets/);
  assert.match(result.reply, /6 LoRA Training Sheets/);
  assert.match(result.reply, /Rico→Ricco/);
});

test('browser task creates a visible GitHub issue draft', () => {
  const result = localCommandReply('/task Ricco Merge-Bible prüfen\n\nDirector-Entwurf:\nRico- und Ricco-Merkmale mit Quellen vergleichen.');
  const url = new URL(result.issueDraftUrl);
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/Pagebabe/comic/issues/new');
  assert.equal(url.searchParams.get('title'), '[WORK PACKET] Ricco Merge-Bible prüfen');
  assert.match(url.searchParams.get('body'), /Rico- und Ricco-Merkmale/);
  assert.match(url.searchParams.get('body'), /M1R · Canon & Asset Recovery/);
  assert.match(url.searchParams.get('body'), /Keine neue Figur/);
  assert.match(url.searchParams.get('body'), /Chris Fact Radar nicht anfassen/);
});

test('render issue stays visibly blocked by M1R', () => {
  const result = localCommandReply('/render ep001-shot-001');
  const url = new URL(result.issueDraftUrl);
  assert.match(result.reply, /M1R/);
  assert.match(url.searchParams.get('body'), /Kein Render ohne freigegebene Canon-Referenz/);
});

test('issue draft always requires explicit GitHub submission', () => {
  const url = new URL(buildIssueDraft({ type: 'RENDER REQUEST', title: 'M1R-RICCO-001' }));
  assert.equal(url.pathname, '/Pagebabe/comic/issues/new');
  assert.match(url.searchParams.get('body'), /erst durch das Absenden auf GitHub verbindlich/);
});

test('browser provider validation is HTTPS-only and allowlisted', () => {
  assert.equal(validateBrowserProviderUrl('http://integrate.api.nvidia.com/v1'), null);
  assert.equal(validateBrowserProviderUrl('https://evil.example/v1'), null);
  assert.equal(validateBrowserProviderUrl('https://integrate.api.nvidia.com/v1/'), 'https://integrate.api.nvidia.com/v1');
  assert.equal(validateBrowserProviderUrl('https://api.openai.com/v1'), 'https://api.openai.com/v1');
});

test('browser LLM call contains the recovered Comic Factory context', async () => {
  let captured;
  const reply = await callBrowserLlm({
    message: 'Prüfe die vorhandene Ricco-Bible.',
    history: [{ role: 'assistant', content: 'Vorher' }],
    apiKey: 'browser-key',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'test-model',
    fetchImpl: async (url, options) => {
      captured = { url, options, body: JSON.parse(options.body) };
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Browser-Antwort' } }] }) };
    }
  });
  assert.equal(reply, 'Browser-Antwort');
  assert.equal(captured.url, 'https://integrate.api.nvidia.com/v1/chat/completions');
  assert.match(captured.body.messages[0].content, /M1R Canon & Asset Recovery/);
  assert.match(captured.body.messages[0].content, /13 Figuren/);
  assert.match(captured.body.messages[0].content, /Keine neue Figur/);
  assert.equal(captured.body.model, 'test-model');
});
