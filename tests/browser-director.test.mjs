import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIssueDraft, callBrowserLlm, localCommandReply, validateBrowserProviderUrl } from '../lib/browser-director.mjs';

test('browser status works without a backend', () => {
  const result = localCommandReply('/status');
  assert.match(result.reply, /M1 Lebenszeichen/);
});

test('browser task creates a visible GitHub issue draft', () => {
  const result = localCommandReply('/task Ricco Test A\n\nDirector-Entwurf:\nKopf, Augen und Mund vorbereiten.');
  const url = new URL(result.issueDraftUrl);
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/Pagebabe/comic/issues/new');
  assert.equal(url.searchParams.get('title'), '[WORK PACKET] Ricco Test A');
  assert.match(url.searchParams.get('body'), /Kopf, Augen und Mund/);
});

test('issue draft always requires explicit GitHub submission', () => {
  const url = new URL(buildIssueDraft({ type: 'RENDER REQUEST', title: 'M1-RICCO-001' }));
  assert.equal(url.pathname, '/Pagebabe/comic/issues/new');
  assert.match(url.searchParams.get('body'), /erst durch das Absenden auf GitHub verbindlich/);
});

test('browser provider validation is HTTPS-only and allowlisted', () => {
  assert.equal(validateBrowserProviderUrl('http://integrate.api.nvidia.com/v1'), null);
  assert.equal(validateBrowserProviderUrl('https://evil.example/v1'), null);
  assert.equal(validateBrowserProviderUrl('https://integrate.api.nvidia.com/v1/'), 'https://integrate.api.nvidia.com/v1');
  assert.equal(validateBrowserProviderUrl('https://api.openai.com/v1'), 'https://api.openai.com/v1');
});

test('browser LLM call contains the Comic Factory context', async () => {
  let captured;
  const reply = await callBrowserLlm({
    message: 'Plane Test A.',
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
  assert.match(captured.body.messages[0].content, /Comic Director/);
  assert.equal(captured.body.model, 'test-model');
});
