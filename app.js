import { callBrowserLlm, localCommandReply } from './lib/browser-director.mjs';

const $ = (selector) => document.querySelector(selector);

const [project, canon, legacyCharacters, productionSheets, loraSheets, castDecisions] = await Promise.all([
  fetch(new URL('./project/project.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/canon.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/character-library.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/character-production-sheets.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lora-training-sheets.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/cast-merge-decisions.json', import.meta.url), { cache: 'no-store' })
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
  content: 'Comic Director bereit. Story, acht Pilotbeats und der Text-Canon für Ricco, Basti, Jule und Don Miau sind gesperrt. Aktive Linie: vorhandene visuelle Character- und Location-Sheets mit dem geprüften Read-only-Scanner sichern und daraus Masterreferenzen auswählen. Keine neue Figur und kein neuer Pilot.'
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
  renderMetrics();
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
    status.textContent = 'Pipeline technisch bestanden';
    status.classList.remove('warn');
    status.classList.add('safe');
    meta.innerHTML = [
      `<strong>${escapeHtml(candidate.durationSeconds)} s</strong>`,
      `${escapeHtml(candidate.width)} × ${escapeHtml(candidate.height)}`,
      `${escapeHtml(candidate.fps)} fps`,
      `${escapeHtml(candidate.videoCodec)} + ${escapeHtml(candidate.audioCodec)}`,
      `${escapeHtml(candidate.audioSampleRateHz)} Hz`,
      'Figur, Raum und Stimme: Platzhalter, nicht Canon'
    ].map((item) => `<span>${item}</span>`).join('');
    healthM1.textContent = '✓ M1-Pipeline validiert · Character Design nicht freigegeben';
  } catch (error) {
    renderReport = null;
    status.textContent = 'Noch nicht bewiesen';
    status.classList.remove('safe');
    status.classList.add('warn');
    meta.textContent = `Kein gültiger Renderbeweis: ${error.message}`;
    healthM1.textContent = '→ M1-Render fehlt oder ist ungültig';
  }
  renderMetrics();
}

function renderHealth() {
  $('#systemStatus').textContent = proxyOnline ? 'Dashboard + Proxy online' : 'Dashboard online';
  $('#healthUi').textContent = '✓ Dashboard im Browser einsatzbereit';
  $('#healthLlm').textContent = proxyOnline && health.checks?.llmConfigured ? '✓ LLM serverseitig konfiguriert' : '→ LLM über Browser-Key oder Proxy verbinden';
  $('#healthGithub').textContent = proxyOnline && health.checks?.githubWriteConfigured && health.checks?.adminProtection ? '✓ GitHub-Schreibweg automatisch geschützt' : '✓ GitHub-Arbeitspakete als bestätigbare Entwürfe';
  $('#botState').textContent = proxyOnline ? 'Sicherer Bot-Proxy erreichbar.' : 'Browser-Modus aktiv. Keine freie Shell und keine versteckten Schreibaktionen.';
}

function renderMetrics() {
  const done = project.milestones.filter((item) => item.state === 'done').length;
  const deploymentVerified = project.deployment?.status === 'online';
  const lockedText = castDecisions.decisions?.filter((item) => item.visualStatus === 'pending_master_reference').length || 0;
  $('#metrics').innerHTML = [
    ['DASHBOARD', deploymentVerified ? 'VERIFIED' : 'ONLINE', deploymentVerified ? 'GitHub Pages · Beweis vorhanden' : 'Browser-Leitstand bereit'],
    ['AKTIVES GATE', project.activeMilestone, 'visuelle Canon- und Asset-Recovery'],
    ['TEXT-CANON', `${lockedText}/4`, 'Ricco · Basti · Jule · Don Miau gesperrt'],
    ['VISUELLE MASTERS', `${project.inventory.visualCharacterMastersLocked}/4`, 'lokaler Asset-Scan ist nächster Schritt'],
    ['FIGURENBESTAND', `${project.inventory.legacyCharacters} + ${project.inventory.coreCharacters}`, `${project.inventory.characterProductionSheets} Produktionssheets · ${project.inventory.loraTrainingSheets} LoRA-Sheets`],
    ['PILOTSTAND', `${project.inventory.canonicalPilotPanels} Beats`, `${project.inventory.legacyPilotPanels} alte Panels · ${project.inventory.legacyTvShots} alte TV-Shots erhalten`],
    ['M1 RENDER', renderReport ? 'TECH PASS' : 'PENDING', renderReport ? 'Pipelinebeweis, kein Character Lock' : 'Technischer Beweis fehlt'],
    ['MEILENSTEINE', `${done}/${project.milestones.length}`, `${project.activeMilestone} ist aktiv`],
    ['EXTERNES BUDGET', `≤${project.budgetMonthlyEur} €`, 'pro Monat zum Start']
  ].map(([label, value, note]) => `<article><small>${label}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`).join('');
}

function renderTimeline() {
  $('#timeline').innerHTML = project.milestones.map((item) => `<div class="stage ${item.state}"><span class="stage-dot">${item.state === 'done' ? '✓' : item.id}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div><span class="stage-state">${item.state === 'active' ? 'AKTIV' : item.state === 'done' ? 'FERTIG' : item.state === 'next' ? 'DANACH' : 'GESPERRT'}</span></div>`).join('');
}

function coreCharacterCard(character) {
  const visual = character.portrait
    ? `<img src="${escapeHtml(character.portrait)}" alt="Technisches Platzhalterporträt von ${escapeHtml(character.name)}" loading="lazy">`
    : '<div class="hair"></div><div class="face"><span class="eye left"></span><span class="eye right"></span><span class="nose"></span><span class="mouth"></span></div><div class="torso"></div>';
  return `<article class="character-card"><div class="portrait" style="--accent:${character.accent}">${visual}<strong>${escapeHtml(character.initials)}</strong></div><div class="character-copy"><span class="character-state">KERNCAST · ${escapeHtml(character.state)}</span><h3>${escapeHtml(character.name)}</h3><p>${escapeHtml(character.role)}</p><small>${character.traits.map(escapeHtml).join(' · ')}</small></div><div class="progress"><span style="width:${character.readiness}%;background:${character.accent}"></span><em>${character.readiness}% Text-/Asset-Reife</em></div></article>`;
}

function legacyCharacterCard(character) {
  const production = productionSheets.find((item) => item.character_id === character.id);
  const lora = loraSheets.find((item) => item.character_id === character.id);
  const migration = canon.coreCast.find((item) => item.migratesFrom?.includes(character.id));
  const state = migration ? `Textlich migriert zu ${migration.name}` : 'Erweiterungsbibliothek';
  const sheetState = `${production ? 'Produktionssheet' : 'kein Produktionssheet'} · ${lora ? `LoRA ${lora.trigger_token}` : 'kein LoRA-Sheet'}`;
  return `<article class="character-card"><div class="portrait" style="--accent:#6f7c91"><strong>${escapeHtml(initials(character.name))}</strong></div><div class="character-copy"><span class="character-state">${escapeHtml(state)}</span><h3>${escapeHtml(character.name)}</h3><p>${escapeHtml(character.role)}</p><small>${escapeHtml(sheetState)}</small><small>${escapeHtml(character.visual_description)}</small></div></article>`;
}

function renderCharacters() {
  const core = project.characters.map(coreCharacterCard).join('');
  const legacy = legacyCharacters.map(legacyCharacterCard).join('');
  $('#characters').innerHTML = `
    <article class="character-card"><div class="character-copy"><span class="character-state">CANON-STATUS</span><h3>4/4 Text-Bibles gesperrt</h3><p>Biografie, Serienfunktion, Sprache, Acting und Kontinuitätsverbote sind verbindlich.</p><small>Die SVGs bleiben Technikplatzhalter. Noch keine visuelle Masterreferenz ist freigegeben.</small></div></article>
    ${core}
    <article class="character-card"><div class="character-copy"><span class="character-state">ERWEITERUNGSBIBLIOTHEK</span><h3>${legacyCharacters.length} vorhandene Figuren</h3><p>${productionSheets.length} Produktionssheets · ${loraSheets.length} LoRA-Trainingssheets</p><small>Keine dieser Figuren wird gelöscht oder automatisch in den Pilot aufgenommen.</small></div></article>
    ${legacy}`;
}

function renderTasks() {
  const tasks = project.activeTasks || project.m1Tasks || [];
  $('#tasks').innerHTML = tasks.map((task, index) => `<article><span>${task.state === 'done' ? '✓' : String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(task.title)}</strong><p>${escapeHtml(task.note)}</p></div></article>`).join('');
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
    completeReply(`Director-Fehler: ${error.message}\n\nFallback: Nutze /status, /next, /characters oder /plan. Für freie KI-Planung muss der Provider Browser-CORS erlauben oder ein Bot-Proxy eingetragen sein.`, 'Keine Projektänderung ausgeführt');
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

renderTimeline();
renderCharacters();
renderTasks();
renderChat();
await Promise.all([probeHealth(), probeM1Proof()]);
