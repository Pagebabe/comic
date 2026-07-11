import { PROJECT_CONTEXT, COMMAND_HELP } from './context.mjs';

const ALLOWED_HOSTS = new Set(['api.openai.com','openrouter.ai','api.deepseek.com','integrate.api.nvidia.com','api.groq.com','api.together.xyz','api.fireworks.ai']);
const firstLine = (value) => String(value).split(/\r?\n/, 1)[0].replace(/\s+/g, ' ').trim().slice(0, 100);

export function localCommandReply(message) {
  const match = String(message).trim().match(/^(\/[a-z-]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return null;
  const command = match[1].toLowerCase();
  const argument = (match[2] || '').trim();
  switch (command) {
    case '/status': return { reply: 'LR0 Truth Reset ist öffentlich abgeschlossen. Aktives Gate: LR1 Pilotentscheidung, Issue #38. Das aktuelle main bleibt eine Audit-/Status-Shell, die Vite-/React-Produktionsapp liegt im Archiv und der Pilot-Canon ist DECISION_REQUIRED. Evidence bleibt partiell ohne Prozentzahl. Character-Master 0/4, Sets 0/4, Stimmen 0/3, fertige Episode nein.' };
    case '/next': return { reply: 'Nächster kontrollierter Schritt: Das Zimmer und Der Solidarpreis neutral nach Serienkern, Figuren, Produktionsaufwand, Wiederholbarkeit und Social-Eignung vergleichen. Danach muss der Nutzer genau einen Kandidaten ausdrücklich auswählen. Vorher keine Studio-Rettung, keine Bildgenerierung, kein Growth OS und kein Blind-Merge.' };
    case '/characters': return { reply: 'Ricco, Basti Prenzl, Jule und Don Miau besitzen ausgearbeitete Kandidaten-Bibles für Das Zimmer, aber keinen endgültig autorisierten Canon-Status. Es existieren 13 Quellenfiguren, 9 Character Production Sheets und 6 LoRA-Sheets. Visuelle Master bleiben 0/4.' };
    case '/plan': return { reply: 'LR0 Truth Reset ✓ → LR1 Pilot menschlich auswählen → LR2 Studio Foundation atomar retten → LR3 Studio-bis-Restore-Loop retten → LR4 realen Fire Test bestehen → LR5 Visual-, Set- und Voice-Locks → LR6 erster echter Pilot.' };
    case '/help': return { reply: COMMAND_HELP };
    case '/task':
    case '/render': {
      if (!argument) return { reply: `Format: ${command} <Titel oder Shot-ID>` };
      const title = firstLine(argument);
      const details = argument.includes('\n') ? argument.slice(argument.indexOf('\n') + 1).trim() : '';
      const isRender = command === '/render';
      return { reply: `${isRender ? 'Renderauftrag' : 'Arbeitspaket'} als GitHub-Entwurf vorbereitet: ${title}${isRender ? '\nAusführung ist durch LR1, Produktionsapp-Rettung und fehlende Visual-Locks blockiert.' : ''}`, issueDraftUrl: buildIssueDraft({ type: isRender ? 'RENDER REQUEST' : 'WORK PACKET', title, details }) };
    }
    default: return null;
  }
}

export function buildIssueDraft({ type, title, details = '' }) {
  const issueTitle = `[${type}] ${firstLine(title)}`;
  const body = `## Ziel\n${firstLine(title)}\n\n## Director-Entwurf\n${details || 'Noch kein Detailentwurf hinterlegt.'}\n\n## Aktive Linie\nLR1 · Pilotentscheidung · Issue #38\n\n## Wahrheitsstatus\n- LR0 Truth Reset: geschlossen und öffentlich bewiesen\n- aktuelles main: Audit-/Status-Shell\n- Produktionsapp: in archive/legacy-comic-2026-07-10 erhalten, noch nicht zurückgeführt\n- Pilot-Canon: DECISION_REQUIRED\n- Evidence: partiell, keine aktuelle Prozentzahl\n\n## Stop-Regeln\n- Kein Growth OS und keine neue Plattformarchitektur.\n- Keine neue Story oder Figur vor der Pilotentscheidung.\n- Kein Blind-Merge des Archivbranches.\n- Kein Render vor Canon-, Produktionsapp- und Visual-Freigabe.\n- Änderungen ausschließlich in Pagebabe/comic.\n\n## Freigabe\nDieses Issue wird erst durch das Absenden auf GitHub verbindlich.`;
  const url = new URL('https://github.com/Pagebabe/comic/issues/new');
  url.searchParams.set('title', issueTitle); url.searchParams.set('body', body); return url.toString();
}

export function validateBrowserProviderUrl(value) { try { const url = new URL(String(value)); if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null; return url.toString().replace(/\/$/, ''); } catch { return null; } }

export async function callBrowserLlm({ message, history, apiKey, baseUrl, model, fetchImpl = fetch }) {
  const url = validateBrowserProviderUrl(baseUrl);
  if (!url) throw new Error('Provider-URL ist im Browser nicht freigegeben.');
  if (!String(apiKey || '').trim()) throw new Error('LLM API-Key fehlt.');
  if (!String(model || '').trim()) throw new Error('LLM Modell fehlt.');
  const safeHistory = Array.isArray(history) ? history.slice(-8).map((entry) => ({ role: entry.role === 'assistant' ? 'assistant' : 'user', content: String(entry.content ?? '').slice(0, 4000) })) : [];
  const response = await fetchImpl(`${url}/chat/completions`, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: String(model).trim().slice(0, 200), messages: [{ role: 'system', content: PROJECT_CONTEXT }, ...safeHistory, { role: 'user', content: String(message).slice(0, 8000) }], temperature: 0.3, max_tokens: 1600 }) });
  if (!response.ok) throw new Error(`Provider HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const data = await response.json(); return data?.choices?.[0]?.message?.content?.trim() || 'Der Provider lieferte keine nutzbare Antwort.';
}
