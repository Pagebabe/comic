import { PROJECT_CONTEXT, COMMAND_HELP } from './context.mjs';

const ALLOWED_HOSTS = new Set([
  'api.openai.com',
  'openrouter.ai',
  'api.deepseek.com',
  'integrate.api.nvidia.com',
  'api.groq.com',
  'api.together.xyz',
  'api.fireworks.ai'
]);

function firstLine(value) {
  return String(value).split(/\r?\n/, 1)[0].replace(/\s+/g, ' ').trim().slice(0, 100);
}

export function localCommandReply(message) {
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
    case '/help':
      return { reply: COMMAND_HELP };
    case '/task':
    case '/render': {
      if (!argument) return { reply: `Format: ${command} <Titel oder Shot-ID>` };
      const title = firstLine(argument);
      const newlineIndex = argument.indexOf('\n');
      const details = newlineIndex >= 0 ? argument.slice(newlineIndex + 1).trim() : '';
      return {
        reply: `${command === '/task' ? 'Arbeitspaket' : 'Renderauftrag'} als GitHub-Entwurf vorbereitet: ${title}`,
        issueDraftUrl: buildIssueDraft({
          type: command === '/task' ? 'WORK PACKET' : 'RENDER REQUEST',
          title,
          details
        })
      };
    }
    default:
      return null;
  }
}

export function buildIssueDraft({ type, title, details = '' }) {
  const issueTitle = `[${type}] ${firstLine(title)}`;
  const body = `## Ziel\n${firstLine(title)}\n\n## Director-Entwurf\n${details || 'Noch kein Detailentwurf hinterlegt.'}\n\n## Aktive Linie\nM1 · Lebenszeichen\n\n## Freigabe\nDieses Issue wird erst durch das Absenden auf GitHub verbindlich.`;
  const url = new URL('https://github.com/Pagebabe/comic/issues/new');
  url.searchParams.set('title', issueTitle);
  url.searchParams.set('body', body);
  return url.toString();
}

export function validateBrowserProviderUrl(value) {
  try {
    const url = new URL(String(value));
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export async function callBrowserLlm({ message, history, apiKey, baseUrl, model, fetchImpl = fetch }) {
  const url = validateBrowserProviderUrl(baseUrl);
  if (!url) throw new Error('Provider-URL ist im Browser nicht freigegeben.');
  if (!String(apiKey || '').trim()) throw new Error('LLM API-Key fehlt.');
  if (!String(model || '').trim()) throw new Error('LLM Modell fehlt.');

  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map((entry) => ({
        role: entry.role === 'assistant' ? 'assistant' : 'user',
        content: String(entry.content ?? '').slice(0, 4000)
      }))
    : [];

  const response = await fetchImpl(`${url}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: String(model).trim().slice(0, 200),
      messages: [{ role: 'system', content: PROJECT_CONTEXT }, ...safeHistory, { role: 'user', content: String(message).slice(0, 8000) }],
      temperature: 0.7,
      max_tokens: 1400
    })
  });

  if (!response.ok) throw new Error(`Provider HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || 'Der Provider lieferte keine nutzbare Antwort.';
}
