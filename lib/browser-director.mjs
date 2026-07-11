import { PROJECT_CONTEXT, COMMAND_HELP } from './context.mjs';

const ALLOWED_HOSTS = new Set(['api.openai.com','openrouter.ai','api.deepseek.com','integrate.api.nvidia.com','api.groq.com','api.together.xyz','api.fireworks.ai']);
const firstLine = (value) => String(value).split(/\r?\n/, 1)[0].replace(/\s+/g, ' ').trim().slice(0, 100);

export function localCommandReply(message) {
  const match = String(message).trim().match(/^(\/[a-z-]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return null;
  const command = match[1].toLowerCase();
  const argument = (match[2] || '').trim();
  switch (command) {
    case '/status': return { reply: 'LR0 bis LR4 sind geschlossen. Das Zimmer ist ausgewählt. Studio Foundation, neutraler Produktionsloop und Selected-Pilot-Fire-Test sind öffentlich bewiesen; LR4 bestand 9/9 Stationen inklusive tatsächlicher Zustandslöschung und hashgleichem Restore. Aktives Gate: LR5 Visual-, Set- und Voice-Locks, Issue #82. Evidence bleibt partiell ohne Prozentzahl. Character-Master 0/4, Sets 0/4, Stimmen 0/3, fertige Episode nein.' };
    case '/next': return { reply: 'Nächster kontrollierter Schritt: Prüfkriterien und Quellenvertrag für genau einen Ricco-Character-Master-Kandidaten festlegen. Danach einen versionierten Kandidaten erzeugen und sichtbar über definierte Ansichten und Ausdrücke reviewen. Kein Massenrendern, keine automatische Masterfreigabe und kein Blind-Merge.' };
    case '/characters': return { reply: 'Ricco, Basti Prenzl, Jule und Don Miau gehören zur ausgewählten Pilotlinie Das Zimmer. LR4 hat ihren Pakettransport bewiesen, nicht ihre visuellen Details. Visuelle Master bleiben 0/4. LR5 beginnt mit Ricco; jede Figur, jeder Ort und jede Stimme braucht eine eigene sichtbare menschliche Review-Entscheidung.' };
    case '/plan': return { reply: 'LR0 Truth Reset ✓ → LR1 Das Zimmer ausgewählt ✓ → LR2 Studio Foundation öffentlich bewiesen ✓ → LR3 neutraler Studio-bis-Restore-Loop öffentlich bewiesen ✓ → LR4 Das-Zimmer-Fire-Test öffentlich bewiesen ✓ → LR5 Visual-, Set- und Voice-Locks aktiv → LR6 erster echter Pilot.' };
    case '/help': return { reply: COMMAND_HELP };
    case '/task':
    case '/render': {
      if (!argument) return { reply: `Format: ${command} <Titel oder Shot-ID>` };
      const title = firstLine(argument);
      const details = argument.includes('\n') ? argument.slice(argument.indexOf('\n') + 1).trim() : '';
      const isRender = command === '/render';
      return { reply: `${isRender ? 'LR5-Renderkandidat' : 'Arbeitspaket'} als GitHub-Entwurf vorbereitet: ${title}${isRender ? '\nKeine Ausführung oder Masterfreigabe wurde erteilt.' : ''}`, issueDraftUrl: buildIssueDraft({ type: isRender ? 'LR5 RENDER CANDIDATE' : 'WORK PACKET', title, details }) };
    }
    default: return null;
  }
}

export function buildIssueDraft({ type, title, details = '' }) {
  const issueTitle = `[${type}] ${firstLine(title)}`;
  const body = `## Ziel\n${firstLine(title)}\n\n## Director-Entwurf\n${details || 'Noch kein Detailentwurf hinterlegt.'}\n\n## Aktive Linie\nLR5 · Visual-, Set- und Voice-Locks · Issue #82\n\n## Wahrheitsstatus\n- LR0 bis LR4: geschlossen und öffentlich bewiesen\n- ausgewählter Pilot: Das Zimmer\n- Character-Master: 0/4\n- Location-Master: 0/4\n- Stimmen: 0/3\n- fertige Episode: nein\n- Evidence: partiell, keine aktuelle Prozentzahl\n\n## Stop-Regeln\n- Kein Growth OS und keine neue Plattformarchitektur.\n- Kein Massenrendern vor geprüftem ersten Master-Kandidaten.\n- Keine automatische Character-, Set- oder Voice-Freigabe.\n- Jeder Kandidat bleibt REVIEW_REQUIRED bis zur menschlichen Entscheidung.\n- Kein Blind-Merge des Archivbranches.\n- Änderungen ausschließlich in Pagebabe/comic.\n\n## Freigabe\nDieses Issue wird erst durch das Absenden auf GitHub verbindlich. Ein Renderkandidat ist kein Master und löst keine Ausführung aus.`;
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
