import { timingSafeEqual } from 'node:crypto';
import { PROJECT_CONTEXT, COMMAND_HELP } from '../lib/context.mjs';

const DEFAULT_ALLOWED_HOSTS = new Set([
  'api.openai.com',
  'openrouter.ai',
  'api.deepseek.com',
  'integrate.api.nvidia.com',
  'api.groq.com',
  'api.together.xyz',
  'api.fireworks.ai'
]);

function sendJson(response, status, payload) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  return response.status(status).json(payload);
}

function getHeader(request, name) {
  const lower = name.toLowerCase();
  const value = request.headers?.get?.(lower) ?? request.headers?.[lower];
  return Array.isArray(value) ? value[0] : value;
}

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseBody(body) {
  if (body == null) return {};
  if (typeof body === 'string') return JSON.parse(body);
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString('utf8'));
  if (typeof body === 'object') return body;
  throw new Error('Unsupported body type');
}

function firstLine(value) {
  return String(value).split(/\r?\n/, 1)[0].replace(/\s+/g, ' ').trim().slice(0, 100);
}

export function commandReply(message) {
  const match = String(message).trim().match(/^(\/[a-z-]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return null;
  const command = match[1].toLowerCase();
  const argument = (match[2] || '').trim();

  switch (command) {
    case '/status':
      return { reply: 'Aktive Linie: M1 Lebenszeichen. Ziel: Ricco spricht 3–5 Sekunden mit Blick, Blinzeln, Mundbewegung, Untertitel und sauberem MP4-Export.' };
    case '/next':
      return { reply: 'Nächster kontrollierter Schritt: Ricco-Arbeitsstimme auswählen. Nur eine Teststimme. Noch kein Voice-Cloning-Projekt beginnen.' };
    case '/characters':
      return { reply: 'Ricco 64% · Character Lock offen\nBasti 48% · Konzept bestätigt\nJule 31% · nach M2\nDon Miau 22% · geparkt' };
    case '/plan':
      return { reply: 'M0 fertig → M1 aktiv → M2 Mini-Szene → M3 Character Lock → M4 erste gute Folge → M5 Wiederholung → erst dann Automatisierung.' };
    case '/task': {
      if (!argument) return { reply: 'Format: /task <klarer Titel>' };
      const title = firstLine(argument);
      const newlineIndex = argument.indexOf('\n');
      const details = newlineIndex >= 0 ? argument.slice(newlineIndex + 1).trim() : '';
      return {
        reply: `Arbeitspaket vorbereitet: ${title}`,
        mutation: {
          title: `[WORK PACKET] ${title}`,
          body: `## Ziel\n${title}\n\n## Director-Entwurf\n${details || 'Noch kein Detailentwurf hinterlegt.'}\n\n## Aktive Linie\nM1 · Lebenszeichen\n\n## Scope-Regeln\n- Keine Änderungen außerhalb des beschriebenen Ziels.\n- Keine neue Plattformfunktion ohne unmittelbaren Produktionsnutzen.\n- Tests, Beweise und bekannte Grenzen dokumentieren.\n\n_Erstellt durch Comic Director._`
        }
      };
    }
    case '/render': {
      if (!argument) return { reply: 'Format: /render <Shot-ID>' };
      const shotId = firstLine(argument);
      return {
        reply: `Renderauftrag vorbereitet: ${shotId}`,
        mutation: {
          title: `[RENDER REQUEST] ${shotId}`,
          body: `## Renderziel\n${shotId}\n\n## Sicherheitsstatus\nDer Auftrag registriert nur das Ziel. Keine freie Shell- oder GPU-Ausführung.\n\n## Gate\nAusführung erst nach geprüftem Asset-Manifest und Kostenfreigabe.\n\n_Erstellt durch Comic Director._`
        }
      };
    }
    case '/help':
      return { reply: COMMAND_HELP };
    default:
      return null;
  }
}

function allowedHosts() {
  const hosts = new Set(DEFAULT_ALLOWED_HOSTS);
  for (const host of String(process.env.LLM_ALLOWED_HOSTS || '').split(',')) {
    if (host.trim()) hosts.add(host.trim().toLowerCase());
  }
  try {
    if (process.env.LLM_BASE_URL) hosts.add(new URL(process.env.LLM_BASE_URL).hostname.toLowerCase());
  } catch {
    // Invalid server configuration is handled when the URL is used.
  }
  return hosts;
}

export function validateProviderUrl(value) {
  try {
    const url = new URL(String(value));
    const host = url.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLocal && process.env.NODE_ENV === 'production') return null;
    if (isLocal) return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString().replace(/\/$/, '') : null;
    if (url.protocol !== 'https:') return null;
    if (!allowedHosts().has(host)) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export async function callLlm({ message, history, apiKey, baseUrl, model, fetchImpl = fetch }) {
  const url = validateProviderUrl(baseUrl);
  if (!url) throw new Error('LLM_BASE_URL ist ungültig oder nicht freigegeben. Ergänze den Host in LLM_ALLOWED_HOSTS.');
  const cleanModel = String(model || '').trim().slice(0, 200);
  if (!cleanModel) throw new Error('LLM_MODEL fehlt.');
  if (!String(apiKey || '').trim()) throw new Error('LLM_API_KEY fehlt.');

  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map((entry) => ({
        role: entry.role === 'assistant' ? 'assistant' : 'user',
        content: String(entry.content ?? '').slice(0, 4000)
      }))
    : [];

  const providerResponse = await fetchImpl(`${url}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: cleanModel,
      messages: [{ role: 'system', content: PROJECT_CONTEXT }, ...safeHistory, { role: 'user', content: String(message).slice(0, 8000) }],
      temperature: 0.7,
      max_tokens: 1400
    })
  });

  if (!providerResponse.ok) throw new Error(`LLM-Provider ${providerResponse.status}: ${(await providerResponse.text()).slice(0, 500)}`);
  const data = await providerResponse.json();
  return data?.choices?.[0]?.message?.content?.trim() || 'Der Provider lieferte keine nutzbare Antwort.';
}

export async function createGitHubIssue(mutation, options = {}) {
  const token = options.token ?? process.env.GITHUB_TOKEN;
  const repository = options.repository ?? process.env.GITHUB_REPOSITORY ?? 'Pagebabe/comic';
  const fetchImpl = options.fetchImpl ?? fetch;
  if (!token) throw new Error('GITHUB_TOKEN fehlt in Vercel.');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('GITHUB_REPOSITORY ist ungültig.');

  const githubResponse = await fetchImpl(`https://api.github.com/repos/${repository}/issues`, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28'
    },
    body: JSON.stringify(mutation)
  });

  if (!githubResponse.ok) throw new Error(`GitHub ${githubResponse.status}: ${(await githubResponse.text()).slice(0, 500)}`);
  return githubResponse.json();
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { reply: 'Nur POST ist erlaubt.' });

  let body;
  try {
    body = parseBody(request.body);
  } catch {
    return sendJson(response, 400, { reply: 'Ungültiges JSON.' });
  }

  const message = String(body?.message ?? '').trim().slice(0, 8000);
  if (!message) return sendJson(response, 400, { reply: 'Nachricht fehlt.' });

  const accessRequired = process.env.COMIC_ACCESS_KEY;
  const suppliedAccess = getHeader(request, 'x-comic-access-key');
  if (accessRequired && !safeEqual(String(suppliedAccess || ''), accessRequired)) {
    return sendJson(response, 401, { reply: 'Zugriff blockiert: Comic-Zugangsschlüssel fehlt oder ist falsch.' });
  }

  const command = message.startsWith('/') ? commandReply(message) : null;
  if (command?.mutation) {
    const expectedAdmin = process.env.COMIC_ADMIN_KEY;
    const suppliedAdmin = getHeader(request, 'x-comic-admin-key');
    if (!expectedAdmin || !safeEqual(String(suppliedAdmin || ''), expectedAdmin)) {
      return sendJson(response, 403, { reply: `${command.reply}\nSchreibaktion blockiert: gültiger Admin-Schlüssel fehlt.` });
    }
    try {
      const issue = await createGitHubIssue(command.mutation);
      return sendJson(response, 200, { reply: `${command.reply}\nGitHub-Issue #${issue.number} wurde angelegt.`, issueUrl: issue.html_url });
    } catch (error) {
      return sendJson(response, 502, { reply: `${command.reply}\nGitHub-Schreibfehler: ${error.message}` });
    }
  }

  if (command) return sendJson(response, 200, command);

  const apiKey = getHeader(request, 'x-llm-api-key') || process.env.LLM_API_KEY;
  const baseUrl = getHeader(request, 'x-llm-base-url') || process.env.LLM_BASE_URL;
  const model = getHeader(request, 'x-llm-model') || process.env.LLM_MODEL;
  if (!apiKey || !baseUrl || !model) {
    return sendJson(response, 503, {
      reply: 'LLM noch nicht konfiguriert. Hinterlege LLM_API_KEY, LLM_BASE_URL und LLM_MODEL in Vercel oder gib die Werte im Provider-Bereich des Dashboards ein. Die festen Steuerbefehle funktionieren bereits.'
    });
  }

  try {
    const reply = await callLlm({ message, history: body?.history, apiKey, baseUrl, model });
    return sendJson(response, 200, { reply });
  } catch (error) {
    return sendJson(response, 502, { reply: `LLM-Fehler: ${error.message}` });
  }
}
