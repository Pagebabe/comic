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
      return { reply: 'Aktive Linie: M1R Canon & Asset Recovery ist geprüft, Visual Preproduction ist bereit. Story, acht Pilotbeats und 4/4 Text-Character-Bibles sind gesperrt. Der lokale Scan fand 0 vertrauenswürdige visuelle Master; 4 Character-Briefs und 4 Location-Briefs sind fertig. Der M1-Clip bleibt ein Technikbeweis. Bildgenerierung ist pausiert.' };
    case '/next':
      return { reply: 'Nächster kontrollierter Schritt: warten, bis der Bildgenerator verfügbar ist. Dann ausschließlich Ricco-Silhouetten und ein Ricco-Character-Sheet nach project/visual-preproduction.json erzeugen. Keine Ersatzpipeline, kein paralleler Cast-Batch und keine Masterfreigabe ohne Sichtprüfung.' };
    case '/characters':
      return { reply: 'Text-Canon 4/4 gesperrt: Ricco (24, ländlicher DJ-Neuling), Basti Prenzl (44, weicher Ex-Linker-Vermieter), Jule (29, Plenum-/Küchenmacht) und Don Miau (alte wortlose Bosskatze). Für alle vier liegen Visual-Briefs vor. Erweiterungsbibliothek: 13 frühe Figuren, 9 Character Production Sheets und 6 LoRA Training Sheets. Offen sind nur visuelle Masterreferenzen, drei Stimmenbeispiele und Don Miaus Fellpalette.' };
    case '/plan':
      return { reply: 'M0 Bestand/Neustart ✓ → M1 technischer Pipelinebeweis ✓ → M1R Text-Canon 4/4 ✓, Recovery geprüft ✓, Visual-Briefs 8/8 ✓, Bildgenerierung pausiert → Ricco zuerst → visuelle Masterreferenzen → M2 kanonische Mini-Szene → M3 Character/Location Lock → M4 Acht-Beat-Animatic → M5 Pilotfolge → M6 Wiederholung → M7 gezielte Automation.' };
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
        reply: `${isRender ? 'Renderauftrag' : 'Arbeitspaket'} als GitHub-Entwurf vorbereitet: ${title}${isRender ? '\nHinweis: M1R blockiert die Ausführung bis visuelle Canon-Assets freigegeben sind.' : ''}`,
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
  const body = `## Ziel\n${firstLine(title)}\n\n## Director-Entwurf\n${details || 'Noch kein Detailentwurf hinterlegt.'}\n\n## Aktive Linie\nM1R · Canon & Asset Recovery · Visual Preproduction bereit · Bildgenerierung pausiert\n\n## Gesperrter Bestand\n- Pilotstory und acht Beats\n- Text-Canon für Ricco, Basti, Jule und Don Miau\n- Vier Character-Briefs und vier Location-Briefs\n\n## Stop-Regeln\n- Keine neue Figur, neue Pilotstory oder neue Stilrichtung.\n- Keine alten Daten löschen oder überschreiben.\n- Keine Ersatzpipeline bei belegtem Bildgenerator.\n- Ricco bleibt das einzige erste Bildziel.\n- Kein Render ohne freigegebene visuelle Canon-Referenz.\n- Chris Fact Radar nicht anfassen.\n\n## Freigabe\nDieses Issue wird erst durch das Absenden auf GitHub verbindlich.`;
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
