import test from 'node:test';
import assert from 'node:assert/strict';
import botHandler, { callLlm, commandReply, createGitHubIssue, validateProviderUrl } from '../api/bot.mjs';
import healthHandler, { healthPayload } from '../api/health.mjs';

function createResponse() {
  const result = { statusCode: 200, headers: {}, body: undefined };
  return {
    setHeader(name, value) { result.headers[name.toLowerCase()] = value; },
    status(code) { result.statusCode = code; return this; },
    json(payload) { result.body = payload; return result; },
    result
  };
}

async function invoke(handler, { method = 'POST', body = {}, headers = {} } = {}) {
  const response = createResponse();
  await handler({ method, body, headers }, response);
  return response.result;
}

async function withEnv(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { return await callback(); }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('fixed status command reports M1R and locked text canon without an LLM', async () => {
  const response = await invoke(botHandler, { body: { message: '/status' } });
  assert.equal(response.statusCode, 200);
  assert.match(response.body.reply, /M1R Canon & Asset Recovery/);
  assert.match(response.body.reply, /4\/4 Text-Character-Bibles/);
  assert.match(response.body.reply, /Platzhalter/);
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('character command exposes locked core cast and recovered inventory', () => {
  const response = commandReply('/characters');
  assert.match(response.reply, /Text-Canon 4\/4 gesperrt/);
  assert.match(response.reply, /Ricco \(24/);
  assert.match(response.reply, /Basti Prenzl \(44/);
  assert.match(response.reply, /Jule \(29/);
  assert.match(response.reply, /wortlose Bosskatze/);
  assert.match(response.reply, /13 frühe Figuren/);
  assert.match(response.reply, /9 Character Production Sheets/);
  assert.match(response.reply, /6 LoRA Training Sheets/);
});

test('next command points to the tested read-only scanner', () => {
  const response = commandReply('/next');
  assert.match(response.reply, /recover_assets\.py/);
  assert.match(response.reply, /read-only/);
  assert.match(response.reply, /Chris Fact Radar/);
});

test('invalid methods and malformed bodies fail safely', async () => {
  assert.equal((await invoke(botHandler, { method: 'GET' })).statusCode, 405);
  assert.equal((await invoke(botHandler, { body: '{broken' })).statusCode, 400);
  assert.equal((await invoke(botHandler, { body: {} })).statusCode, 400);
});

test('access protection blocks a wrong key', async () => {
  await withEnv({ COMIC_ACCESS_KEY: 'correct-key' }, async () => {
    const blocked = await invoke(botHandler, { body: { message: '/status' }, headers: { 'x-comic-access-key': 'wrong-key' } });
    const allowed = await invoke(botHandler, { body: { message: '/status' }, headers: { 'x-comic-access-key': 'correct-key' } });
    assert.equal(blocked.statusCode, 401);
    assert.equal(allowed.statusCode, 200);
  });
});

test('GitHub mutations remain blocked without the admin key', async () => {
  await withEnv({ COMIC_ADMIN_KEY: 'admin-secret', GITHUB_TOKEN: undefined }, async () => {
    const response = await invoke(botHandler, { body: { message: '/task Visuelle Ricco-Referenzen prüfen' } });
    assert.equal(response.statusCode, 403);
    assert.match(response.body.reply, /Schreibaktion blockiert/);
  });
});

test('free text reports missing provider configuration', async () => {
  await withEnv({ LLM_API_KEY: undefined, LLM_BASE_URL: undefined, LLM_MODEL: undefined }, async () => {
    const response = await invoke(botHandler, { body: { message: 'Prüfe vorhandene Bilder gegen die Text-Bibles.' } });
    assert.equal(response.statusCode, 503);
    assert.match(response.body.reply, /LLM noch nicht konfiguriert/);
  });
});

test('provider URLs use an explicit allowlist', async () => {
  await withEnv({ NODE_ENV: 'production', LLM_ALLOWED_HOSTS: 'llm.example.test' }, async () => {
    assert.equal(validateProviderUrl('http://api.openai.com/v1'), null);
    assert.equal(validateProviderUrl('https://127.0.0.1/v1'), null);
    assert.equal(validateProviderUrl('https://evil.example/v1'), null);
    assert.equal(validateProviderUrl('https://integrate.api.nvidia.com/v1'), 'https://integrate.api.nvidia.com/v1');
    assert.equal(validateProviderUrl('https://llm.example.test/v1/'), 'https://llm.example.test/v1');
  });
});

test('LLM requests use the locked project context and bounded history', async () => {
  let request;
  const reply = await callLlm({
    message: 'Prüfe vorhandene Bilder gegen Riccos Text-Bible.',
    history: [{ role: 'assistant', content: 'Vorherige Antwort' }],
    apiKey: 'test-key',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'test-model',
    fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Geprüfte Antwort' } }] }) };
    }
  });
  assert.equal(reply, 'Geprüfte Antwort');
  assert.equal(request.url, 'https://integrate.api.nvidia.com/v1/chat/completions');
  assert.equal(request.body.model, 'test-model');
  assert.match(request.body.messages[0].content, /M1R Canon & Asset Recovery/);
  assert.match(request.body.messages[0].content, /Ricco: 24/);
  assert.match(request.body.messages[0].content, /Don Miau.*spricht niemals/s);
  assert.match(request.body.messages[0].content, /Keine neue Figur/);
  assert.match(request.body.messages[0].content, /Chris Fact Radar/);
  assert.ok(request.body.messages.length <= 10);
});

test('GitHub issue creation is scoped to the configured comic repository', async () => {
  let request;
  const issue = await createGitHubIssue(
    { title: '[WORK PACKET] Test', body: 'Body' },
    {
      token: 'github-token',
      repository: 'Pagebabe/comic',
      fetchImpl: async (url, options) => {
        request = { url, options };
        return { ok: true, json: async () => ({ number: 42, html_url: 'https://github.com/Pagebabe/comic/issues/42' }) };
      }
    }
  );
  assert.equal(issue.number, 42);
  assert.equal(request.url, 'https://api.github.com/repos/Pagebabe/comic/issues');
  assert.match(request.options.headers.authorization, /github-token/);
  assert.doesNotMatch(request.url, /chris-fact-radar/);
});

test('task command records M1R scope, locked canon and isolation', () => {
  const command = commandReply('/task Visuelle Ricco-Referenzen prüfen\n\nDirector-Entwurf:\nDetails');
  assert.equal(command.mutation.title, '[WORK PACKET] Visuelle Ricco-Referenzen prüfen');
  assert.match(command.mutation.body, /Director-Entwurf/);
  assert.match(command.mutation.body, /M1R · Canon & Asset Recovery/);
  assert.match(command.mutation.body, /Text-Canon für Ricco, Basti, Jule und Don Miau/);
  assert.match(command.mutation.body, /Keine neue Figur/);
  assert.match(command.mutation.body, /Chris Fact Radar bleibt unangetastet/);
});

test('render command remains blocked by the visual M1R gate', () => {
  const command = commandReply('/render ep001-shot-001');
  assert.match(command.reply, /M1R/);
  assert.match(command.reply, /visuellen Canon-Freigabe/);
  assert.match(command.mutation.body, /BLOCKED_BY_M1R/);
  assert.match(command.mutation.body, /freigegebener visueller Character-\/Location-Referenz/);
});

test('health endpoint reports readiness without exposing secrets', async () => {
  const payload = healthPayload({ COMIC_ACCESS_KEY: 'x', COMIC_ADMIN_KEY: 'y', LLM_API_KEY: 'a', LLM_BASE_URL: 'b', LLM_MODEL: 'c', GITHUB_TOKEN: 'd', GITHUB_REPOSITORY: 'e/f' });
  assert.equal(payload.status, 'ok');
  assert.equal(payload.checks.llmConfigured, true);
  assert.equal(JSON.stringify(payload).includes('COMIC_ACCESS_KEY'), false);
  const response = await invoke(healthHandler, { method: 'GET' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.service, 'comic-factory-director');
});
