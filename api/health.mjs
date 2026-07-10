function sendJson(response, status, payload) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  return response.status(status).json(payload);
}

export function healthPayload(env = process.env) {
  return {
    status: 'ok',
    service: 'comic-factory-director',
    version: '1.0.1',
    milestone: 'M1',
    checks: {
      accessProtection: Boolean(env.COMIC_ACCESS_KEY),
      adminProtection: Boolean(env.COMIC_ADMIN_KEY),
      llmConfigured: Boolean(env.LLM_API_KEY && env.LLM_BASE_URL && env.LLM_MODEL),
      githubWriteConfigured: Boolean(env.GITHUB_TOKEN && env.GITHUB_REPOSITORY)
    }
  };
}

export default function handler(request, response) {
  if (request.method !== 'GET') return sendJson(response, 405, { status: 'error', message: 'Nur GET ist erlaubt.' });
  return sendJson(response, 200, healthPayload());
}
