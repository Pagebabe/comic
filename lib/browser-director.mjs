import { PROJECT_CONTEXT, COMMAND_HELP } from './context.mjs';

const ALLOWED_HOSTS = new Set(['api.openai.com','openrouter.ai','api.deepseek.com','integrate.api.nvidia.com','api.groq.com','api.together.xyz','api.fireworks.ai']);
const firstLine = (value) => String(value).split(/\r?\n/, 1)[0].replace(/\s+/g, ' ').trim().slice(0, 100);

export function localCommandReply(message) {
  const match = String(message).trim().match(/^(\/[a-z-]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return null;
  const command = match[1].toLowerCase();
  const argument = (match[2] || '').trim();
  switch (command) {
    case '/status': return { reply: 'LR0 bis LR4 sind öffentlich geschlossen. Parent-Gate: LR5 Issue #82. Einziges aktives Arbeitspaket: LR5.1 Ricco Visual-Master-Vertrag, Issue #88. Status CONTRACT_READY_REVIEW_REQUIRED, Quellen 7, Konflikte 5, Reviewtests 10, Kandidaten 0/1. Bildgenerierung, Batch, LoRA und automatische Masterfreigabe sind gesperrt. Character-Master 0/4, Sets 0/4, Stimmen 0/3, fertige Episode nein.' };
    case '/next': return { reply: 'Nächster kontrollierter Schritt: LR5.1-Vertrag und sichtbaren Nullzustand durch CI, Desktop, Mobil und Pages beweisen. Danach ist CONTRACT_APPROVED_FOR_ONE_CANDIDATE als ausdrückliche menschliche Entscheidung nötig. Erst dann darf genau ein Ricco-Review-Sheet erzeugt werden. Aktuell keine Bild-, GPU-, Provider- oder LoRA-Ausführung.' };
    case '/characters': return { reply: 'Ricco, Basti Prenzl, Jule und Don Miau gehören zur Pilotlinie Das Zimmer. Ricco steht bei REVIEW_REQUIRED und 0/1 Kandidat; sein Dashboard-SVG ist kein Master. Basti, Jule, Don Miau, Sets und Stimmen bleiben durch LR5.1 blockiert.' };
    case '/plan': return { reply: 'LR0 Truth Reset ✓ → LR1 Das Zimmer ✓ → LR2 Studio Foundation ✓ → LR3 neutraler Delete-and-Restore-Loop ✓ → LR4 Das-Zimmer-Fire-Test ✓ → LR5 aktiv → LR5.1 Ricco-Vertrag REVIEW_REQUIRED, 0/1, Ausführung gesperrt → danach übrige Master → LR6 erster echter Pilot.' };
    case '/help': return { reply: COMMAND_HELP };
    case '/render': return { reply: `RENDER BLOCKED · ${argument ? firstLine(argument) : 'kein Shot angegeben'}. Vor CONTRACT_APPROVED_FOR_ONE_CANDIDATE wird kein Render-Issue vorbereitet und keine Bild-, GPU-, Provider- oder LoRA-Ausführung ausgelöst.` };
    case '/task': {
      if (!argument) return { reply: 'Format: /task <Titel>' };
      const title = firstLine(argument);
      const details = argument.includes('\n') ? argument.slice(argument.indexOf('\n') + 1).trim() : '';
      return { reply: `LR5.1-Arbeitspaket als GitHub-Entwurf vorbereitet: ${title}`, issueDraftUrl: buildIssueDraft({ type: 'LR5.1 WORK PACKET', title, details }) };
    }
    default: return null;
  }
}

export function buildIssueDraft({ type, title, details = '' }) {
  const issueTitle = `[${type}] ${firstLine(title)}`;
  const body = `## Ziel\n${firstLine(title)}\n\n## Director-Entwurf\n${details || 'Noch kein Detailentwurf hinterlegt.'}\n\n## Aktive Linie\nLR5 Parent-Gate · Issue #82\nLR5.1 Ricco Visual-Master-Vertrag · Issue #88\n\n## Wahrheitsstatus\n- LR0 bis LR4: geschlossen und öffentlich bewiesen\n- ausgewählter Pilot: Das Zimmer\n- Ricco-Vertrag: CONTRACT_READY_REVIEW_REQUIRED\n- Quellen: 7\n- Konflikte: 5\n- Kandidaten: 0/1\n- Bildgenerierung jetzt erlaubt: nein\n- Character-Master: 0/4\n- Location-Master: 0/4\n- Stimmen: 0/3\n- fertige Episode: nein\n\n## Stop-Regeln\n- Keine Bildgenerierung vor CONTRACT_APPROVED_FOR_ONE_CANDIDATE.\n- Danach genau ein Ricco-Review-Sheet, kein Batch.\n- Kein LoRA-Training vor menschlich freigegebenem Ricco-Master.\n- Keine parallele Set-, Voice- oder weitere Character-Arbeit.\n- Keine automatische Masterfreigabe.\n- Kein Growth OS und keine neue Plattformarchitektur.\n- Änderungen ausschließlich in Pagebabe/comic.\n\n## Freigabe\nDieses Issue wird erst durch das Absenden auf GitHub verbindlich. Es erteilt keine Bild- oder Masterfreigabe.`;
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
