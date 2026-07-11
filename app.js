import { callBrowserLlm, localCommandReply } from './lib/browser-director.mjs';

const $ = (selector) => document.querySelector(selector);

const [project, truth, candidates, legacyCharacters, productionSheets, loraSheets] = await Promise.all([
  fetch(new URL('./project/project.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/canon-candidates.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/character-library.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/character-production-sheets.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lora-training-sheets.json', import.meta.url), { cache: 'no-store' })
]).then(async (responses) => {
  for (const response of responses) {
    if (!response.ok) throw new Error(`Projektdatei konnte nicht geladen werden: HTTP ${response.status}`);
  }
  return Promise.all(responses.map((response) => response.json()));
});

const sessionFields = ['accessKey', 'adminKey', 'apiUrl', 'baseUrl', 'model', 'apiKey'];
for (const id of sessionFields) {
  const input = document.getElementById(id);
  input.value = sessionStorage.getItem(`comic:${id}`) || '';
  input.addEventListener('input', () => sessionStorage.setItem(`comic:${id}`, input.value));
}

let health = { status: 'browser', checks: {} };
let proxyOnline = false;
let renderReport = null;
const messages = JSON.parse(localStorage.getItem('comic:messages') || '[]');
if (!messages.length) messages.push({
  role: 'assistant',
  content: 'Comic Director bereit. Aktive Linie: Line Reset. Das aktuelle main ist eine Status-Shell, die frühere Produktionsapp liegt im Archiv und der Pilot-Canon ist nicht ausgewählt. Ich darf Rettungsschritte prüfen, aber keine Canon- oder Produktionsreife erfinden.'
});
let lastAssistant = messages.filter((item) => item.role === 'assistant').at(-1)?.content || '';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function configuredApiUrl() {
  const custom = $('#apiUrl').value.trim();
  return custom || new URL('./api/bot', window.location.href).toString();
}

function healthUrl() {
  return configuredApiUrl().replace(/\/bot\/?$/, '/health');
}

async function probeHealth() {
  proxyOnline = false;
  health = { status: 'browser', checks: {} };
  try {
    const response = await fetch(healthUrl(), { cache: 'no-store' });
    if (response.ok) {
      health = await response.json();
      proxyOnline = health.status === 'ok';
    }
  } catch {
    proxyOnline = false;
  }
  renderHealth();
}

async function probeM1Proof() {
  const status = $('#m1ProofStatus');
  const meta = $('#m1ProofMeta');
  const healthM1 = $('#healthM1');
  try {
    const response = await fetch(new URL('./media/m1/render-report.json', import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Renderreport HTTP ${response.status}`);
    const candidate = await response.json();
    if (candidate.status !== 'passed' || candidate.sceneId !== 'm1-life-sign' || candidate.characterId !== 'ricco') {
      throw new Error('Renderreport passt nicht zum technischen M1-Beweis');
    }
    renderReport = candidate;
    status.textContent = 'Technischer Medienpfad bestanden';
    status.classList.remove('warn');
    status.classList.add('safe');
    meta.innerHTML = [
      `<strong>${escapeHtml(candidate.durationSeconds)} s</strong>`,
      `${escapeHtml(candidate.width)} × ${escapeHtml(candidate.height)}`,
      `${escapeHtml(candidate.fps)} fps`,
      `${escapeHtml(candidate.videoCodec)} + ${escapeHtml(candidate.audioCodec)}`,
      `${escapeHtml(candidate.audioSampleRateHz)} Hz`,
      'Figur, Raum und Stimme: Platzhalter'
    ].map((item) => `<span>${item}</span>`).join('');
    healthM1.textContent = '✓ M1-Medienpfad validiert · keine Canon-Freigabe';
  } catch (error) {
    renderReport = null;
    status.textContent = 'Noch nicht bewiesen';
    status.classList.remove('safe');
    status.classList.add('warn');
    meta.textContent = `Kein gültiger Renderbeweis: ${error.message}`;
    healthM1.textContent = '→ M1-MP4 fehlt oder ist ungültig';
  }
}

function renderHealth() {
  $('#systemStatus').textContent = proxyOnline ? 'Line Reset + Proxy online' : 'Line Reset · Dashboard online';
  $('#healthUi').textContent = '✓ Wahrheits-Dashboard im Browser erreichbar';
  $('#healthLlm').textContent = proxyOnline && health.checks?.llmConfigured ? '✓ LLM serverseitig konfiguriert' : '→ LLM optional über Browser-Key oder Proxy';
  $('#healthGithub').textContent = proxyOnline && health.checks?.githubWriteConfigured && health.checks?.adminProtection ? '✓ GitHub-Schreibweg geschützt' : '✓ GitHub-Arbeitspakete nur als bestätigbare Entwürfe';
  $('#botState').textContent = proxyOnline ? 'Sicherer Bot-Proxy erreichbar.' : 'Browser-Modus aktiv. Keine freie Shell und keine versteckten Schreibaktionen.';
}

function renderMetrics() {
  $('#metrics').innerHTML = [
    ['WAHRHEITSSTATUS', 'LINE RESET', 'Issue #36 aktiv'],
    ['PRODUKTIONSAPP', 'ARCHIV', 'erhalten · noch nicht zurückgeführt'],
    ['PILOT-CANON', 'OFFEN', `${candidates.candidates.length} Kandidaten · keine Auswahl`],
    ['EVIDENCE', 'PARTIELL', 'quellgebunden · keine Prozentzahl'],
    ['VISUELLE MASTERS', '0/8', '0/4 Figuren · 0/4 Sets'],
    ['STIMMEN', '0/3', 'keine freigegebene Canon-Stimme'],
    ['FERTIGE EPISODE', 'NEIN', 'kein Finalexport vorhanden'],
    ['TECHNIKBEWEIS', renderReport ? 'PASS' : 'CHECK', 'M1-Medienpfad nur']
  ].map(([label, value, note]) => `<article><small>${label}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`).join('');
}

function renderCockpit() {
  const archive = truth.productArchitecture.productionFoundation;
  $('#productionCockpit').innerHTML = `
    <article class="cockpit-card primary">
      <span class="cockpit-kicker">AKTUELLE LINIE</span>
      <strong>Wahrheit vor Fortschritt</strong>
      <p>Das Dashboard bleibt erreichbar, aber es wird nicht mehr als vollständige Comic Factory ausgegeben. Canon und Produktarchitektur sind sauber getrennt.</p>
      <div class="status-line"><span class="status-dot safe"></span><b>Nächstes Gate:</b> öffentlicher Truth Reset</div>
    </article>
    <article class="cockpit-card">
      <span class="cockpit-kicker">PRODUKTIONSBASIS</span>
      <strong>Archiv erhalten</strong>
      <p>${escapeHtml(archive.branch)} bewahrt Studio, Prompt Queue, Review, QA, Lettering, Package und Restore.</p>
      <a href="https://github.com/Pagebabe/comic/tree/archive/legacy-comic-2026-07-10">Archiv öffnen</a>
    </article>
    <article class="cockpit-card">
      <span class="cockpit-kicker">CANON</span>
      <strong>DECISION_REQUIRED</strong>
      <p>${candidates.candidates.map((item) => escapeHtml(item.title)).join(' · ')}. Vorhandene Dateien sind Kandidatenmaterial, keine menschliche Auswahl.</p>
      <a href="./project/canon-candidates.json">Kandidaten vergleichen</a>
    </article>
    <article class="cockpit-card next">
      <span class="cockpit-kicker">NÄCHSTE AUFGABEN</span>
      <ol><li>Truth Reset deployen</li><li>Pilot bewusst auswählen</li><li>Studio Foundation retten</li><li>Minimalen Produktionsloop im Fire Test beweisen</li></ol>
    </article>`;
}

function renderTimeline() {
  $('#timeline').innerHTML = truth.nextSequence.map((item) => {
    const state = item.status === 'active' ? 'active' : item.status.startsWith('blocked') ? 'locked' : 'next';
    const label = item.status === 'active' ? 'AKTIV' : item.status === 'blocked_human_decision' ? 'ENTSCHEIDUNG' : 'GESPERRT';
    return `<div class="stage ${state}"><span class="stage-dot">${escapeHtml(item.id)}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.doneWhen)}</p></div><span class="stage-state">${label}</span></div>`;
  }).join('');
}

function coreCharacterCard(character) {
  return `<article class="character-card core-card" style="--accent:${escapeHtml(character.accent)}">
    <div class="portrait audit-placeholder"><div class="visual-unproven"><span>VISUAL OFFEN</span><b>Figurenplan, kein Master</b><small>Technische SVGs werden nicht als Figur gezeigt.</small></div><strong>${escapeHtml(character.initials)}</strong></div>
    <div class="character-copy">
      <span class="character-state">KANDIDATENMATERIAL · NICHT FINALER CANON</span>
      <h3>${escapeHtml(character.name)}</h3>
      <p>${escapeHtml(character.role)}</p>
      <ul class="trait-list">${character.traits.map((trait) => `<li>${escapeHtml(trait)}</li>`).join('')}</ul>
    </div>
    <div class="card-footer"><span>Textplan vorhanden</span><span>menschliche Bestätigung offen</span></div>
  </article>`;
}

function legacyCharacterRow(character) {
  const production = productionSheets.find((item) => item.character_id === character.id);
  const lora = loraSheets.find((item) => item.character_id === character.id);
  return `<article class="legacy-row">
    <span class="legacy-avatar">${escapeHtml(initials(character.name))}</span>
    <div><strong>${escapeHtml(character.name)}</strong><small>${escapeHtml(character.role)}</small></div>
    <span>Quellenbibliothek</span>
    <span>${production ? 'Production Sheet' : 'ohne Production Sheet'}</span>
    <span>${lora ? 'LoRA Sheet' : 'ohne LoRA Sheet'}</span>
  </article>`;
}

function renderCharacters() {
  $('#characters').innerHTML = `
    <article class="character-summary">
      <div><span class="character-state">AUTORITÄTSSTATUS</span><h3>Figurenpläne vorhanden · Canon offen</h3><p>Ricco, Basti, Jule und Don Miau besitzen ausgearbeitete Kandidaten-Bibles. Sie bleiben nutzbar, werden aber erst nach einer menschlichen Pilot- und Cast-Entscheidung endgültiger Canon.</p></div>
      <div class="summary-stats"><span><b>4</b> Kernpläne</span><span><b>13</b> Legacy-Figuren</span><span class="open"><b>0/4</b> Masterreferenzen</span></div>
    </article>
    <div class="core-cast-grid">${project.characters.map(coreCharacterCard).join('')}</div>
    <details class="legacy-library">
      <summary><span><b>${legacyCharacters.length} erhaltene Quellenfiguren</b><small>${productionSheets.length} Production Sheets · ${loraSheets.length} LoRA-Sheets</small></span><em>Bibliothek öffnen</em></summary>
      <div class="legacy-grid">${legacyCharacters.map(legacyCharacterRow).join('')}</div>
    </details>`;
}

function renderTasks() {
  $('#tasks').innerHTML = `<div class="task-summary"><strong>Line Reset aktiv</strong><span>${truth.nextSequence.length} kontrollierte Gates</span></div>${truth.nextSequence.map((item, index) => `<article class="task-${item.status === 'active' ? 'ready' : 'blocked'}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.doneWhen)}</p></div><em>${escapeHtml(item.status)}</em></article>`).join('')}`;
}

function renderChat() {
  $('#chat').innerHTML = messages.map((message) => `<div class="message ${message.role === 'assistant' ? 'bot' : 'user'}">${escapeHtml(message.content)}</div>`).join('');
  $('#chat').scrollTop = $('#chat').scrollHeight;
  localStorage.setItem('comic:messages', JSON.stringify(messages.slice(-30)));
}

function proxyHeaders() {
  return {
    'content-type': 'application/json',
    'x-comic-access-key': $('#accessKey').value,
    'x-comic-admin-key': $('#adminKey').value,
    'x-llm-api-key': $('#apiKey').value,
    'x-llm-base-url': $('#baseUrl').value,
    'x-llm-model': $('#model').value
  };
}

function completeReply(reply, state, issueUrl) {
  messages.push({ role: 'assistant', content: reply });
  lastAssistant = reply;
  $('#botState').innerHTML = issueUrl ? `${escapeHtml(state)}: <a href="${escapeHtml(issueUrl)}" target="_blank" rel="noreferrer">GitHub-Entwurf öffnen</a>` : escapeHtml(state);
  renderChat();
}

async function sendThroughProxy(clean) {
  const response = await fetch(configuredApiUrl(), {
    method: 'POST',
    headers: proxyHeaders(),
    body: JSON.stringify({ message: clean, history: messages.slice(-12, -1) })
  });
  const data = await response.json();
  if (!response.ok && response.status >= 500) throw new Error(data.reply || `Proxy HTTP ${response.status}`);
  return { reply: data.reply || 'Keine Antwort erhalten.', issueUrl: data.issueUrl, state: `Proxy HTTP ${response.status}` };
}

async function sendDirectly(clean) {
  const reply = await callBrowserLlm({
    message: clean,
    history: messages.slice(-12, -1),
    apiKey: $('#apiKey').value,
    baseUrl: $('#baseUrl').value,
    model: $('#model').value
  });
  return { reply, state: 'Direkter Browser-Provider. Key wurde nicht gespeichert.' };
}

async function send(message) {
  const clean = message.trim();
  if (!clean) return;
  messages.push({ role: 'user', content: clean });
  renderChat();
  $('#botState').textContent = 'Director arbeitet …';

  const localCommand = localCommandReply(clean);
  if (localCommand && (!proxyOnline || !clean.startsWith('/task') && !clean.startsWith('/render'))) {
    if (localCommand.issueDraftUrl) window.open(localCommand.issueDraftUrl, '_blank', 'noopener,noreferrer');
    completeReply(localCommand.reply, localCommand.issueDraftUrl ? 'Bestätigung auf GitHub erforderlich' : 'Lokal geprüft', localCommand.issueDraftUrl);
    return;
  }

  try {
    const result = proxyOnline ? await sendThroughProxy(clean) : await sendDirectly(clean);
    completeReply(result.reply, result.state, result.issueUrl);
  } catch (error) {
    if ((clean.startsWith('/task') || clean.startsWith('/render')) && localCommand?.issueDraftUrl) {
      window.open(localCommand.issueDraftUrl, '_blank', 'noopener,noreferrer');
      completeReply(localCommand.reply, 'Proxy nicht verfügbar; GitHub-Bestätigung erforderlich', localCommand.issueDraftUrl);
      return;
    }
    completeReply(`Director-Fehler: ${error.message}\n\nFallback: Nutze /status, /next, /characters oder /plan.`, 'Keine Projektänderung ausgeführt');
  }
}

$('#chatForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#messageInput');
  const value = input.value;
  input.value = '';
  void send(value);
});

document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => void send(button.dataset.prompt)));
$('#saveAsTask').addEventListener('click', () => {
  if (!lastAssistant) return;
  const title = prompt('Kurzer Titel des Arbeitspakets:');
  if (!title) return;
  void send(`/task ${title}\n\nDirector-Entwurf:\n${lastAssistant}`);
});
$('#apiUrl').addEventListener('change', () => void probeHealth());
$('#m1Video').addEventListener('error', () => {
  $('#m1ProofStatus').textContent = 'Video nicht abspielbar';
  $('#m1ProofStatus').classList.add('warn');
  $('#healthM1').textContent = '→ M1-MP4 konnte nicht geladen werden';
});

renderMetrics();
renderCockpit();
renderTimeline();
renderCharacters();
renderTasks();
renderChat();
await Promise.all([probeHealth(), probeM1Proof()]);
renderMetrics();
