const $ = (selector) => document.querySelector(selector);
const project = await fetch('/project/project.json', { cache: 'no-store' }).then((response) => {
  if (!response.ok) throw new Error(`Projektstatus ${response.status}`);
  return response.json();
});

let health = { status: 'offline', checks: {} };
try {
  const response = await fetch('/api/health', { cache: 'no-store' });
  if (response.ok) health = await response.json();
} catch {
  health = { status: 'offline', checks: {} };
}

const sessionFields = ['accessKey', 'adminKey', 'baseUrl', 'model', 'apiKey'];
for (const id of sessionFields) {
  const input = document.getElementById(id);
  input.value = sessionStorage.getItem(`comic:${id}`) || '';
  input.addEventListener('input', () => sessionStorage.setItem(`comic:${id}`, input.value));
}

const messages = JSON.parse(localStorage.getItem('comic:messages') || '[]');
if (!messages.length) messages.push({ role: 'assistant', content: 'Comic Director bereit. Aktive Linie: M1 Lebenszeichen. Ich kann Figuren, Story-Arcs, Folgen, Drehbücher und Produktionspläne entwickeln. Änderungen am Projekt werden erst nach deiner Freigabe als GitHub-Auftrag gespeichert.' });
let lastAssistant = messages.filter((item) => item.role === 'assistant').at(-1)?.content || '';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function renderHealth() {
  const online = health.status === 'ok';
  $('#systemStatus').textContent = online ? 'Runtime erreichbar' : 'Runtime nicht bewiesen';
  $('#healthUi').textContent = online ? '✓ Dashboard-API erreichbar' : '→ Dashboard-API noch nicht erreichbar';
  $('#healthLlm').textContent = health.checks?.llmConfigured ? '✓ LLM serverseitig konfiguriert' : '→ LLM noch nicht serverseitig konfiguriert';
  $('#healthGithub').textContent = health.checks?.githubWriteConfigured && health.checks?.adminProtection ? '✓ GitHub-Schreibweg geschützt konfiguriert' : '→ GitHub-Schreibweg noch nicht vollständig konfiguriert';
  $('#botState').textContent = online ? 'Runtime bereit. Schreibaktionen benötigen den Admin-Schlüssel.' : 'API nicht erreichbar. Keine Projektänderung möglich.';
}

function renderMetrics() {
  const done = project.milestones.filter((item) => item.state === 'done').length;
  const runtime = health.status === 'ok' ? 'ONLINE' : 'OFFEN';
  $('#metrics').innerHTML = [
    ['RUNTIME', runtime, health.status === 'ok' ? `Version ${escapeHtml(health.version || '?')}` : 'Deployment prüfen'],
    ['MEILENSTEINE', `${done}/8`, 'M0 gesichert'],
    ['AKTIVE FIGUREN', '2', 'Ricco · Basti'],
    ['EXTERNES BUDGET', `≤${project.budgetMonthlyEur} €`, 'pro Monat zum Start']
  ].map(([label, value, note]) => `<article><small>${label}</small><strong>${value}</strong><span>${note}</span></article>`).join('');
}

function renderTimeline() {
  $('#timeline').innerHTML = project.milestones.map((item) => `<div class="stage ${item.state}"><span class="stage-dot">${item.state === 'done' ? '✓' : item.id}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div><span class="stage-state">${item.state === 'active' ? 'AKTIV' : item.state === 'done' ? 'FERTIG' : item.state === 'next' ? 'DANACH' : 'GESPERRT'}</span></div>`).join('');
}

function renderCharacters() {
  $('#characters').innerHTML = project.characters.map((character) => `<article class="character-card"><div class="portrait" style="--accent:${character.accent}"><div class="hair"></div><div class="face"><span class="eye left"></span><span class="eye right"></span><span class="nose"></span><span class="mouth"></span></div><div class="torso"></div><strong>${escapeHtml(character.initials)}</strong></div><div class="character-copy"><span class="character-state">${escapeHtml(character.state)}</span><h3>${escapeHtml(character.name)}</h3><p>${escapeHtml(character.role)}</p><small>${character.traits.map(escapeHtml).join(' · ')}</small></div><div class="progress"><span style="width:${character.readiness}%;background:${character.accent}"></span><em>${character.readiness}%</em></div></article>`).join('');
}

function renderTasks() {
  $('#tasks').innerHTML = project.m1Tasks.map((task, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(task.title)}</strong><p>${escapeHtml(task.note)}</p></div></article>`).join('');
}

function renderChat() {
  $('#chat').innerHTML = messages.map((message) => `<div class="message ${message.role === 'assistant' ? 'bot' : 'user'}">${escapeHtml(message.content)}</div>`).join('');
  $('#chat').scrollTop = $('#chat').scrollHeight;
  localStorage.setItem('comic:messages', JSON.stringify(messages.slice(-30)));
}

function headers() {
  return {
    'content-type': 'application/json',
    'x-comic-access-key': $('#accessKey').value,
    'x-comic-admin-key': $('#adminKey').value,
    'x-llm-api-key': $('#apiKey').value,
    'x-llm-base-url': $('#baseUrl').value,
    'x-llm-model': $('#model').value
  };
}

async function send(message) {
  const clean = message.trim();
  if (!clean) return;
  messages.push({ role: 'user', content: clean });
  renderChat();
  $('#botState').textContent = 'Director arbeitet …';
  try {
    const response = await fetch('/api/bot', { method: 'POST', headers: headers(), body: JSON.stringify({ message: clean, history: messages.slice(-12, -1) }) });
    const data = await response.json();
    const reply = data.reply || 'Keine Antwort erhalten.';
    messages.push({ role: 'assistant', content: reply });
    lastAssistant = reply;
    $('#botState').innerHTML = data.issueUrl ? `Auftrag gespeichert: <a href="${escapeHtml(data.issueUrl)}" target="_blank" rel="noreferrer">GitHub öffnen</a>` : `Antwort bereit · HTTP ${response.status}. Änderungen sind noch nicht gespeichert.`;
  } catch (error) {
    messages.push({ role: 'assistant', content: `Bot nicht erreichbar: ${error.message}` });
    $('#botState').textContent = 'Fehler. Keine Projektänderung wurde ausgeführt.';
  }
  renderChat();
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

renderHealth();
renderMetrics();
renderTimeline();
renderCharacters();
renderTasks();
renderChat();
