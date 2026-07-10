import { callBrowserLlm, localCommandReply } from './lib/browser-director.mjs';

const $ = (selector) => document.querySelector(selector);

const [project, canon, legacyCharacters, productionSheets, loraSheets, castDecisions, timingReport] = await Promise.all([
  fetch(new URL('./project/project.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/canon.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/character-library.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/character-production-sheets.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lora-training-sheets.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/cast-merge-decisions.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./media/ep001/ep001-timing-report.json', import.meta.url), { cache: 'no-store' })
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
  content: 'Comic Director bereit. Text-Canon, acht Pilotbeats, Visual-Briefs, Animatic-Blueprint und Timing-SRT sind geprüft. Bildgenerierung ist pausiert. Sobald sie wieder verfügbar ist, bleibt Ricco das einzige erste visuelle Ziel.'
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
  const deploymentVerified = project.deployment?.status === 'online';
  const lockedText = castDecisions.decisions?.filter((item) => item.visualStatus === 'pending_master_reference').length || 0;
  const timingPass = timingReport.pacingStatus === 'pass' && timingReport.cuesAbove17CharactersPerSecond?.length === 0;
  $('#metrics').innerHTML = [
    ['SYSTEM', deploymentVerified ? 'ONLINE' : 'CHECK', deploymentVerified ? 'GitHub Pages verifiziert' : 'Deployment wird geprüft'],
    ['TEXT-CANON', `${lockedText}/4`, 'Ricco · Basti · Jule · Don Miau'],
    ['VISUAL-BRIEFS', '8/8', '4 Figuren · 4 Pilotsets'],
    ['ANIMATIC', `${project.inventory.animaticBlueprintPanels}/8`, `${project.inventory.animaticBlueprintDurationSeconds} Sekunden geplant`],
    ['TIMING', timingPass ? 'PASS' : 'REVIEW', `${timingReport.subtitleCueCount}/10 Cues · max. ${timingReport.maximumCharactersPerSecond} CPS`],
    ['VISUELLE MASTERS', '0/8', '0/4 Figuren · 0/4 Sets'],
    ['STIMMEN', `${project.inventory.approvedVoiceSamples}/3`, 'Ricco · Basti · Jule offen'],
    ['NÄCHSTER LOCK', 'RICCO', 'Silhouetten → Character Sheet → Sichtprüfung']
  ].map(([label, value, note]) => `<article><small>${label}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`).join('');
}

function renderCockpit() {
  const timingPass = timingReport.pacingStatus === 'pass';
  $('#productionCockpit').innerHTML = `
    <article class="cockpit-card primary">
      <span class="cockpit-kicker">PRODUKTIONSSTATUS</span>
      <strong>Vorproduktion aktiv</strong>
      <p>Recovery abgeschlossen. Visual-Briefs, Blueprint und Timing stehen. Bildgenerierung bleibt bewusst pausiert.</p>
      <div class="status-line"><span class="status-dot safe"></span><b>Nächstes Gate:</b> Ricco Master Lock</div>
    </article>
    <article class="cockpit-card">
      <span class="cockpit-kicker">STORY & ANIMATIC</span>
      <strong>8/8 Panels · 45,5 s</strong>
      <p>Nur gesperrte Figuren, Orte und Dialogzeilen. Noch keine echten Panelbilder.</p>
      <a href="./project/ep001-animatic-blueprint.json">Blueprint öffnen</a>
    </article>
    <article class="cockpit-card">
      <span class="cockpit-kicker">TIMING & UNTERTITEL</span>
      <strong>${timingPass ? 'PASS' : 'REVIEW'} · ${escapeHtml(timingReport.maximumCharactersPerSecond)} CPS</strong>
      <p>${escapeHtml(timingReport.subtitleCueCount)} Cues, ${escapeHtml(timingReport.spokenSeconds)} s Sprache, ${escapeHtml(timingReport.silentOrReactionSeconds)} s Reaktion und Atmosphäre.</p>
      <div class="cockpit-links"><a href="./media/ep001/ep001-timing-draft.srt">SRT</a><a href="./media/ep001/ep001-timing-report.json">Report</a></div>
    </article>
    <article class="cockpit-card next">
      <span class="cockpit-kicker">NÄCHSTE AUFGABEN</span>
      <ol><li>Ricco-Silhouetten erzeugen</li><li>Ricco Character Sheet prüfen</li><li>Ricco Master freigeben</li><li>Erst danach Basti, Jule und Don Miau</li></ol>
    </article>`;
}

function renderTimeline() {
  $('#timeline').innerHTML = project.milestones.map((item) => `<div class="stage ${item.state}"><span class="stage-dot">${item.state === 'done' ? '✓' : item.id}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div><span class="stage-state">${item.state === 'active' ? 'AKTIV' : item.state === 'done' ? 'FERTIG' : item.state === 'next' ? 'DANACH' : 'GESPERRT'}</span></div>`).join('');
}

function coreCharacterCard(character) {
  const visual = character.portrait
    ? `<img src="${escapeHtml(character.portrait)}" alt="Technisches Platzhalterporträt von ${escapeHtml(character.name)}" loading="lazy">`
    : '<div class="hair"></div><div class="face"><span class="eye left"></span><span class="eye right"></span><span class="nose"></span><span class="mouth"></span></div><div class="torso"></div>';
  return `<article class="character-card core-card" style="--accent:${escapeHtml(character.accent)}">
    <div class="portrait">${visual}<strong>${escapeHtml(character.initials)}</strong></div>
    <div class="character-copy">
      <span class="character-state">KERNCAST · VISUAL MASTER OFFEN</span>
      <h3>${escapeHtml(character.name)}</h3>
      <p>${escapeHtml(character.role)}</p>
      <ul class="trait-list">${character.traits.map((trait) => `<li>${escapeHtml(trait)}</li>`).join('')}</ul>
    </div>
    <div class="card-footer"><span>Text-Bible gesperrt</span><span>Visual-Brief fertig</span></div>
    <div class="progress"><span style="width:${character.readiness}%;background:${escapeHtml(character.accent)}"></span><em>${character.readiness}% Vorbereitungsreife</em></div>
  </article>`;
}

function legacyCharacterRow(character) {
  const production = productionSheets.find((item) => item.character_id === character.id);
  const lora = loraSheets.find((item) => item.character_id === character.id);
  const migration = canon.coreCast.find((item) => item.migratesFrom?.includes(character.id));
  const state = migration ? `Migriert zu ${migration.name}` : 'Erweiterungsbibliothek';
  return `<article class="legacy-row">
    <span class="legacy-avatar">${escapeHtml(initials(character.name))}</span>
    <div><strong>${escapeHtml(character.name)}</strong><small>${escapeHtml(character.role)}</small></div>
    <span>${escapeHtml(state)}</span>
    <span>${production ? 'Production Sheet' : 'ohne Production Sheet'}</span>
    <span>${lora ? 'LoRA Sheet' : 'ohne LoRA Sheet'}</span>
  </article>`;
}

function renderCharacters() {
  const core = project.characters.map(coreCharacterCard).join('');
  const legacy = legacyCharacters.map(legacyCharacterRow).join('');
  $('#characters').innerHTML = `
    <article class="character-summary">
      <div><span class="character-state">CANON-STATUS</span><h3>4/4 Text-Bibles gesperrt</h3><p>Identität, Serienfunktion, Sprache, Acting und Kontinuitätsverbote stehen. Die sichtbaren SVGs bleiben Technikplatzhalter.</p></div>
      <div class="summary-stats"><span><b>4/4</b> Text-Canon</span><span><b>4/4</b> Visual-Briefs</span><span class="open"><b>0/4</b> Masterreferenzen</span></div>
    </article>
    <div class="core-cast-grid">${core}</div>
    <details class="legacy-library">
      <summary><span><b>${legacyCharacters.length} gerettete Legacy-Figuren</b><small>${productionSheets.length} Production Sheets · ${loraSheets.length} LoRA-Sheets</small></span><em>Bibliothek öffnen</em></summary>
      <div class="legacy-grid">${legacy}</div>
    </details>`;
}

function renderTasks() {
  const tasks = project.activeTasks || project.m1Tasks || [];
  const openTasks = tasks.filter((task) => task.state !== 'done');
  const doneCount = tasks.length - openTasks.length;
  $('#tasks').innerHTML = `<div class="task-summary"><strong>${doneCount} Grundlagen erledigt</strong><span>${openTasks.length} aktive oder blockierte Produktionsschritte</span></div>${openTasks.map((task, index) => `<article class="task-${escapeHtml(task.state)}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(task.title)}</strong><p>${escapeHtml(task.note)}</p></div><em>${escapeHtml(task.state)}</em></article>`).join('')}`;
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

renderCockpit();
renderTimeline();
renderCharacters();
renderTasks();
renderChat();
await Promise.all([probeHealth(), probeM1Proof()]);
