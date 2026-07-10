import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIssueDraft, callBrowserLlm, localCommandReply, validateBrowserProviderUrl } from '../lib/browser-director.mjs';

test('browser status reports M1R, recovery, visual prep and the locked animatic blueprint', () => {
  const result = localCommandReply('/status');
  assert.match(result.reply, /M1R Canon & Asset Recovery/);
  assert.match(result.reply, /8 Panels/);
  assert.match(result.reply, /45,5 Sekunden/);
  assert.match(result.reply, /4\/4 Text-Character-Bibles/);
  assert.match(result.reply, /0 vertrauenswürdige visuelle Master/);
  assert.match(result.reply, /Bildgenerierung ist pausiert/);
  assert.match(result.reply, /noch kein gerendertes Animatic/);
  assert.match(result.reply, /Technikbeweis/);
});

test('browser character command exposes locked core cast and prepared visual briefs', () => {
  const result = localCommandReply('/characters');
  assert.match(result.reply, /Text-Canon 4\/4 gesperrt/);
  assert.match(result.reply, /Ricco \(24/);
  assert.match(result.reply, /Basti Prenzl \(44/);
  assert.match(result.reply, /Jule \(29/);
  assert.match(result.reply, /wortlose Bosskatze/);
  assert.match(result.reply, /Visual-Briefs/);
  assert.match(result.reply, /13 frühe Figuren/);
  assert.match(result.reply, /9 Character Production Sheets/);
  assert.match(result.reply, /6 LoRA Training Sheets/);
});

test('browser next command prepares a neutral readthrough and keeps Ricco first', () => {
  const result = localCommandReply('/next');
  assert.match(result.reply, /neutraler Dialog-Readthrough/);
  assert.match(result.reply, /45,5-Sekunden-Struktur/);
  assert.match(result.reply, /keine Stimme als Canon/);
  assert.match(result.reply, /Bildgenerator verfügbar/);
  assert.match(result.reply, /ausschließlich Ricco-Silhouetten/);
  assert.match(result.reply, /Keine Ersatzpipeline/);
  assert.match(result.reply, /kein paralleler Cast-Batch/);
});

test('browser plan distinguishes blueprint from rendered animatic', () => {
  const result = localCommandReply('/plan');
  assert.match(result.reply, /EP001 Blueprint 8 Panels \/ 45,5 s/);
  assert.match(result.reply, /neutraler Timing-Readthrough/);
  assert.match(result.reply, /Ricco zuerst/);
  assert.match(result.reply, /gerendertes Acht-Beat-Animatic/);
});

test('browser task creates a visible GitHub issue draft with locked canon, visual prep and blueprint', () => {
  const result = localCommandReply('/task EP001 Timing prüfen\n\nDirector-Entwurf:\nDas gesperrte Acht-Panel-Blueprint ohne Bild- oder Voice-Lock prüfen.');
  const url = new URL(result.issueDraftUrl);
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/Pagebabe/comic/issues/new');
  assert.equal(url.searchParams.get('title'), '[WORK PACKET] EP001 Timing prüfen');
  const body = url.searchParams.get('body');
  assert.match(body, /gesperrte Acht-Panel-Blueprint/);
  assert.match(body, /M1R · Canon & Asset Recovery/);
  assert.match(body, /Visual Preproduction bereit/);
  assert.match(body, /EP001 Blueprint 8 Panels \/ 45,5 Sekunden/);
  assert.match(body, /Text-Canon für Ricco, Basti, Jule und Don Miau/);
  assert.match(body, /Vier Character-Briefs und vier Location-Briefs/);
  assert.match(body, /Animatic-Blueprint mit gesperrten Dialogzeilen/);
  assert.match(body, /Keine neue Figur/);
  assert.match(body, /Keine Ersatzpipeline/);
  assert.match(body, /Ricco bleibt das einzige erste Bildziel/);
  assert.match(body, /Blueprint nicht als gerendertes Animatic/);
  assert.match(body, /Chris Fact Radar nicht anfassen/);
});

test('render issue stays visibly blocked by visual M1R gate', () => {
  const result = localCommandReply('/render ep001-shot-001');
  const url = new URL(result.issueDraftUrl);
  assert.match(result.reply, /M1R/);
  assert.match(result.reply, /visuelle Canon-Assets/);
  assert.match(url.searchParams.get('body'), /Kein Render ohne freigegebene visuelle Canon-Referenz/);
  assert.match(url.searchParams.get('body'), /Blueprint nicht als gerendertes Animatic/);
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

test('browser LLM call contains the locked Comic Factory visual and animatic context', async () => {
  let captured;
  const reply = await callBrowserLlm({
    message: 'Prüfe den 45,5-Sekunden-Readthrough, ohne Bilder oder Stimmen zu locken.',
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
  const system = captured.body.messages[0].content;
  assert.match(system, /M1R Canon & Asset Recovery/);
  assert.match(system, /6\.047 Dateien/);
  assert.match(system, /4 Character-Briefs/);
  assert.match(system, /EP001 Animatic Blueprint/);
  assert.match(system, /45,5 Sekunden/);
  assert.match(system, /tatsächliche Animatic-Panelbilder bleiben 0\/8/);
  assert.match(system, /Ricco: 24/);
  assert.match(system, /Don Miau.*spricht niemals/s);
  assert.match(system, /Keine neue Figur/);
  assert.match(system, /Keine Ersatzpipeline/);
  assert.match(system, /kein gerendertes Animatic/i);
  assert.equal(captured.body.model, 'test-model');
});
