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

test('fixed status command works without an LLM', async () => {
  const response = await invoke(botHandler, { body: { message: '/status' } });
  assert.equal(response.statusCode, 200);
  assert.match(response.body.reply, /M1 Lebenszeichen/);
  assert.equal(response.headers['cache-control'], 'no-store');
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
    const response = await invoke(botHandler, { body: { message: '/task Ricco voice test' } });
    assert.equal(response.statusCode, 403);
    assert.match(response.body.reply, /Schreibaktion blockiert/);
  });
});

test('free text reports missing provider configuration', async () => {
  await withEnv({ LLM_API_KEY: undefined, LLM_BASE_URL: undefined, LLM_MODEL: undefined }, async () => {
    const response = await invoke(botHandler, { body: { message: 'Plane eine Folge.' } });
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

test('LLM requests use the project context and bounded history', async () => {
  let request;
  const reply = await callLlm({
    message: 'Plane eine kurze Szene.',
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
  assert.match(request.body.messages[0].content, /Comic Director/);
  assert.ok(request.body.messages.length <= 10);
});

test('GitHub issue creation is scoped to the configured repository', async () => {
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
});

test('task command separates the title from the director draft', () => {
  const command = commandReply('/task Ricco Test A\n\nDirector-Entwurf:\nDetails');
  assert.equal(command.mutation.title, '[WORK PACKET] Ricco Test A');
  assert.match(command.mutation.body, /Director-Entwurf/);
  assert.match(command.mutation.body, /Details/);
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
