import { PROJECT_CONTEXT, COMMAND_HELP } from '../lib/context.mjs';

const json = (response, status = 200) => new Response(JSON.stringify(response), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

function commandReply(message) {
  const [command, ...rest] = message.trim().split(/\s+/);
  const argument = rest.join(' ').trim();
  switch (command.toLowerCase()) {
    case '/status': return { reply: 'Aktive Linie: M1 Lebenszeichen. Ziel: Ricco spricht 3–5 Sekunden mit Blick, Blinzeln, Mundbewegung, Untertitel und sauberem MP4-Export.' };
    case '/next': return { reply: 'Nächster kontrollierter Schritt: Ricco-Arbeitsstimme auswählen. Nur eine Teststimme. Noch kein Voice-Cloning-Projekt beginnen.' };
    case '/characters': return { reply: 'Ricco 64% · Character Lock offen\nBasti 48% · Konzept bestätigt\nJule 31% · nach M2\nDon Miau 22% · geparkt' };
    case '/plan': return { reply: 'M0 fertig → M1 aktiv → M2 Mini-Szene → M3 Character Lock → M4 erste gute Folge → M5 Wiederholung → erst dann Automatisierung.' };
    case '/task':
      if (!argument) return { reply: 'Format: /task <klarer Titel>' };
      return { reply: `Arbeitspaket vorbereitet: ${argument}`, mutation: { title: `[WORK PACKET] ${argument.slice(0, 120)}`, body: `## Ziel\n${argument}\n\n## Aktive Linie\nM1 · Lebenszeichen\n\n## Scope-Regeln\n- Keine Änderungen außerhalb des beschriebenen Ziels.\n- Keine neue Plattformfunktion ohne unmittelbaren Produktionsnutzen.\n- Tests, Beweise und bekannte Grenzen dokumentieren.\n\n_Erstellt durch Comic Director._` } };
    case '/render':
      if (!argument) return { reply: 'Format: /render <Shot-ID>' };
      return { reply: `Renderauftrag vorbereitet: ${argument}`, mutation: { title: `[RENDER REQUEST] ${argument.slice(0, 120)}`, body: `## Renderziel\n${argument}\n\n## Sicherheitsstatus\nDer Auftrag registriert nur das Ziel. Keine freie Shell- oder GPU-Ausführung.\n\n## Gate\nAusführung erst nach geprüftem Asset-Manifest und Kostenfreigabe.\n\n_Erstellt durch Comic Director._` } };
    case '/help': return { reply: COMMAND_HELP };
    default: return null;
  }
}

function validateProviderUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null;
    return url.toString().replace(/\/$/, '');
  } catch { return null; }
}

async function callLlm({ message, history, apiKey, baseUrl, model }) {
  const url = validateProviderUrl(baseUrl);
  if (!url) throw new Error('Ungültige LLM_BASE_URL. HTTPS ist erforderlich.');
  const safeHistory = Array.isArray(history) ? history.slice(-12).map((entry) => ({ role: entry.role === 'assistant' ? 'assistant' : 'user', content: String(entry.content ?? '').slice(0, 12000) })) : [];
  const response = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: PROJECT_CONTEXT }, ...safeHistory, { role: 'user', content: message }], temperature: 0.7, max_tokens: 1800 })
  });
  if (!response.ok) throw new Error(`LLM-Provider ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || 'Der Provider lieferte keine nutzbare Antwort.';
}

async function createGitHubIssue(mutation) {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY || 'Pagebabe/comic';
  if (!token) throw new Error('GITHUB_TOKEN fehlt in Vercel.');
  const response = await fetch(`https://api.github.com/repos/${repository}/issues`, {
    method: 'POST',
    headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-github-api-version': '2022-11-28' },
    body: JSON.stringify(mutation)
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return response.json();
}

export default async function handler(request) {
  if (request.method !== 'POST') return json({ reply: 'Nur POST ist erlaubt.' }, 405);
  let body;
  try { body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body; } catch { return json({ reply: 'Ungültiges JSON.' }, 400); }
  const message = String(body?.message ?? '').trim().slice(0, 16000);
  if (!message) return json({ reply: 'Nachricht fehlt.' }, 400);

  const accessRequired = process.env.COMIC_ACCESS_KEY;
  const suppliedAccess = request.headers['x-comic-access-key'];
  if (accessRequired && suppliedAccess !== accessRequired) return json({ reply: 'Zugriff blockiert: Comic-Zugangsschlüssel fehlt oder ist falsch.' }, 401);

  const command = message.startsWith('/') ? commandReply(message) : null;
  if (command?.mutation) {
    const expectedAdmin = process.env.COMIC_ADMIN_KEY;
    const suppliedAdmin = request.headers['x-comic-admin-key'];
    if (!expectedAdmin || suppliedAdmin !== expectedAdmin) return json({ reply: `${command.reply}\nSchreibaktion blockiert: gültiger Admin-Schlüssel fehlt.` }, 403);
    try {
      const issue = await createGitHubIssue(command.mutation);
      return json({ reply: `${command.reply}\nGitHub-Issue #${issue.number} wurde angelegt.`, issueUrl: issue.html_url });
    } catch (error) { return json({ reply: `${command.reply}\nGitHub-Schreibfehler: ${error.message}` }, 502); }
  }
  if (command) return json(command);

  const apiKey = request.headers['x-llm-api-key'] || process.env.LLM_API_KEY;
  const baseUrl = request.headers['x-llm-base-url'] || process.env.LLM_BASE_URL;
  const model = request.headers['x-llm-model'] || process.env.LLM_MODEL;
  if (!apiKey || !baseUrl || !model) return json({ reply: 'LLM noch nicht konfiguriert. Hinterlege LLM_API_KEY, LLM_BASE_URL und LLM_MODEL in Vercel oder gib die Werte im Provider-Bereich des Dashboards ein. Die festen Steuerbefehle funktionieren bereits.' }, 503);
  try { return json({ reply: await callLlm({ message, history: body?.history, apiKey, baseUrl, model }) }); }
  catch (error) { return json({ reply: `LLM-Fehler: ${error.message}` }, 502); }
}
