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
      return { reply: 'Aktive Linie: M1R Canon & Asset Recovery. Der technische M1-Clip ist bestanden, aber nur als Pipelinebeweis. Vor M2 müssen Story, Kerncast, Erweiterungsbibliothek, Production/LoRA-Sheets und echte visuelle Masterreferenzen vollständig gesichert und zusammengeführt werden.' };
    case '/next':
      return { reply: 'Nächster kontrollierter Schritt: vorhandene visuelle Character- und Location-Sheets in lokalen outputs, public/generated, Package-JSONs, Browser-Backups und Sicherungen lokalisieren. Parallel werden Rico→Ricco, Falk→Basti und Kralle→Don Miau als Merge-Bibles vorbereitet. Keine neue Figur und kein neuer Render.' };
    case '/characters':
      return { reply: 'Aktiver Kerncast: Ricco, Basti Prenzl, Jule, Don Miau. Erhaltene frühe Bibliothek: 13 Figuren. Verifiziert: 9 Character Production Sheets und 6 LoRA Training Sheets. Migration offen: Rico→Ricco, Falk→Basti, Kralle→Don Miau. Sami, Rita, Kira, Olli, DJ Krätze, DJ Nebel, Sven Null, Mutti, Möpse und Flitz bleiben als Erweiterungsbibliothek.' };
    case '/plan':
      return { reply: 'M0 Bestand/Neustart ✓ → M1 technischer Pipelinebeweis ✓ → M1R Canon & Asset Recovery aktiv → M2 kanonische Zwei-Figuren-Mini-Szene → M3 Character/Location Lock → M4 Acht-Beat-Animatic → M5 erste gute Pilotfolge → M6 Wiederholung → M7 gezielte Comic-Factory-Automation.' };
    case '/help':
      return { reply: COMMAND_HELP };
    case '/task':
    case '/render': {
      if (!argument) return { reply: `Format: ${command} <Titel oder Shot-ID>` };
      const title = firstLine(argument);
      const newlineIndex = argument.indexOf('\n');
      const details = newlineIndex >= 0 ? argument.slice(newlineIndex + 1).trim() : '';
      const isRender = command === '/render';
      return {
        reply: `${isRender ? 'Renderauftrag' : 'Arbeitspaket'} als GitHub-Entwurf vorbereitet: ${title}${isRender ? '\nHinweis: M1R blockiert die Ausführung bis Canon-Assets freigegeben sind.' : ''}`,
        issueDraftUrl: buildIssueDraft({
          type: isRender ? 'RENDER REQUEST' : 'WORK PACKET',
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
  const body = `## Ziel\n${firstLine(title)}\n\n## Director-Entwurf\n${details || 'Noch kein Detailentwurf hinterlegt.'}\n\n## Aktive Linie\nM1R · Canon & Asset Recovery\n\n## Stop-Regeln\n- Keine neue Figur, neue Pilotstory oder neue Stilrichtung.\n- Keine alten Daten löschen oder überschreiben.\n- Kein Render ohne freigegebene Canon-Referenz.\n- Chris Fact Radar nicht anfassen.\n\n## Freigabe\nDieses Issue wird erst durch das Absenden auf GitHub verbindlich.`;
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
      temperature: 0.5,
      max_tokens: 1600
    })
  });

  if (!response.ok) throw new Error(`Provider HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || 'Der Provider lieferte keine nutzbare Antwort.';
}
