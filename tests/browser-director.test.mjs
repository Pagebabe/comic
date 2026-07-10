import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIssueDraft, callBrowserLlm, localCommandReply, validateBrowserProviderUrl } from '../lib/browser-director.mjs';

test('browser status reports M1R and locked text canon without a backend', () => {
  const result = localCommandReply('/status');
  assert.match(result.reply, /M1R Canon & Asset Recovery/);
  assert.match(result.reply, /4\/4 Text-Character-Bibles/);
  assert.match(result.reply, /Technikbeweis/);
});

test('browser character command exposes locked core cast and recovered inventory', () => {
  const result = localCommandReply('/characters');
  assert.match(result.reply, /Text-Canon 4\/4 gesperrt/);
  assert.match(result.reply, /Ricco \(24/);
  assert.match(result.reply, /Basti Prenzl \(44/);
  assert.match(result.reply, /Jule \(29/);
  assert.match(result.reply, /wortlose Bosskatze/);
  assert.match(result.reply, /13 frühe Figuren/);
  assert.match(result.reply, /9 Character Production Sheets/);
  assert.match(result.reply, /6 LoRA Training Sheets/);
});

test('browser next command points to the tested read-only scanner', () => {
  const result = localCommandReply('/next');
  assert.match(result.reply, /recover_assets\.py/);
  assert.match(result.reply, /read-only/);
  assert.match(result.reply, /Chris Fact Radar/);
});

test('browser task creates a visible GitHub issue draft with locked canon', () => {
  const result = localCommandReply('/task Visuelle Ricco-Referenzen prüfen\n\nDirector-Entwurf:\nVorhandene Bilder mit der gesperrten Ricco-Bible vergleichen.');
  const url = new URL(result.issueDraftUrl);
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/Pagebabe/comic/issues/new');
  assert.equal(url.searchParams.get('title'), '[WORK PACKET] Visuelle Ricco-Referenzen prüfen');
  assert.match(url.searchParams.get('body'), /gesperrten Ricco-Bible/);
  assert.match(url.searchParams.get('body'), /M1R · Canon & Asset Recovery/);
  assert.match(url.searchParams.get('body'), /Text-Canon für Ricco, Basti, Jule und Don Miau/);
  assert.match(url.searchParams.get('body'), /Keine neue Figur/);
  assert.match(url.searchParams.get('body'), /Chris Fact Radar nicht anfassen/);
});

test('render issue stays visibly blocked by visual M1R gate', () => {
  const result = localCommandReply('/render ep001-shot-001');
  const url = new URL(result.issueDraftUrl);
  assert.match(result.reply, /M1R/);
  assert.match(result.reply, /visuelle Canon-Assets/);
  assert.match(url.searchParams.get('body'), /Kein Render ohne freigegebene visuelle Canon-Referenz/);
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

test('browser LLM call contains the locked Comic Factory context', async () => {
  let captured;
  const reply = await callBrowserLlm({
    message: 'Prüfe vorhandene Bilder gegen Riccos gesperrte Bible.',
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
  assert.match(captured.body.messages[0].content, /Ricco: 24/);
  assert.match(captured.body.messages[0].content, /Don Miau.*spricht niemals/s);
  assert.match(captured.body.messages[0].content, /Keine neue Figur/);
  assert.equal(captured.body.model, 'test-model');
});
