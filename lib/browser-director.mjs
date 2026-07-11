import { PROJECT_CONTEXT, COMMAND_HELP } from './context.mjs';

const ALLOWED_HOSTS = new Set(['api.openai.com','openrouter.ai','api.deepseek.com','integrate.api.nvidia.com','api.groq.com','api.together.xyz','api.fireworks.ai']);
const firstLine = (value) => String(value).split(/\r?\n/, 1)[0].replace(/\s+/g, ' ').trim().slice(0, 100);

export function localCommandReply(message) {
  const match = String(message).trim().match(/^(\/[a-z-]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return null;
  const command = match[1].toLowerCase();
  const argument = (match[2] || '').trim();
  switch (command) {
    case '/status': return { reply: 'LR0, LR1 und LR2 sind geschlossen. Das Zimmer ist ausgewählt. Die Studio Foundation ist öffentlich unter /studio/ bewiesen. Aktives Gate: LR3 Produktionsloop retten, Issue #60. Control, Prompt Queue, Import, Review, QA, Lettering, Package und Restore sind noch nicht als ein Loop bewiesen. Evidence bleibt partiell ohne Prozentzahl. Character-Master 0/4, Sets 0/4, Stimmen 0/3, fertige Episode nein.' };
    case '/next': return { reply: 'Nächster kontrollierter Schritt: die archivierten Produktionsmodule einzeln inventarisieren und genau einen neutralen EpisodePackage-Vertrag festlegen. Danach Control, Studio, Queue, Import, Review, QA, Lettering, Package, Löschen und Restore als deterministischen Testpfad verbinden. Kein Blind-Merge, keine Bildgenerierung und keine externe automatische Ausführung.' };
    case '/characters': return { reply: 'Ricco, Basti Prenzl, Jule und Don Miau gehören zur ausgewählten Pilotlinie Das Zimmer. Ihre Bibles bleiben Detail-Ausgangsmaterial mit offenem Review. Visuelle Master bleiben 0/4; LR3 testet nur den neutralen Produktionsloop.' };
    case '/plan': return { reply: 'LR0 Truth Reset ✓ → LR1 Das Zimmer ausgewählt ✓ → LR2 Studio Foundation öffentlich bewiesen ✓ → LR3 neutralen Studio-bis-Restore-Loop retten → LR4 Das-Zimmer-Fire-Test → LR5 Visual-, Set- und Voice-Locks → LR6 erster echter Pilot.' };
    case '/help': return { reply: COMMAND_HELP };
    case '/task':
    case '/render': {
      if (!argument) return { reply: `Format: ${command} <Titel oder Shot-ID>` };
      const title = firstLine(argument);
      const details = argument.includes('\n') ? argument.slice(argument.indexOf('\n') + 1).trim() : '';
      const isRender = command === '/render';
      return { reply: `${isRender ? 'Renderauftrag' : 'Arbeitspaket'} als GitHub-Entwurf vorbereitet: ${title}${isRender ? '\nAusführung ist durch LR3, LR4 und fehlende Visual-Locks blockiert.' : ''}`, issueDraftUrl: buildIssueDraft({ type: isRender ? 'RENDER REQUEST' : 'WORK PACKET', title, details }) };
    }
    default: return null;
  }
}

export function buildIssueDraft({ type, title, details = '' }) {
  const issueTitle = `[${type}] ${firstLine(title)}`;
  const body = `## Ziel\n${firstLine(title)}\n\n## Director-Entwurf\n${details || 'Noch kein Detailentwurf hinterlegt.'}\n\n## Aktive Linie\nLR3 · Minimalen Produktionsloop retten · Issue #60\n\n## Wahrheitsstatus\n- LR0, LR1 und LR2: geschlossen und bewiesen\n- Studio Foundation: öffentlich unter /studio/\n- ausgewählter Pilot: Das Zimmer\n- Produktionsloop: noch nicht gerettet\n- Detail-Canon, Visuals und Stimmen: eigene Freigaben offen\n- Evidence: partiell, keine aktuelle Prozentzahl\n\n## Stop-Regeln\n- Kein Growth OS und keine neue Plattformarchitektur.\n- Keine Bildgenerierung oder externe automatische Ausführung.\n- Kein Blind-Merge des Archivbranches.\n- Kein Render vor LR3, LR4 und Visual-Freigabe.\n- Änderungen ausschließlich in Pagebabe/comic.\n\n## Freigabe\nDieses Issue wird erst durch das Absenden auf GitHub verbindlich.`;
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
