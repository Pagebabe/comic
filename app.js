import { callBrowserLlm, localCommandReply } from './lib/browser-director.mjs';

const $ = (selector) => document.querySelector(selector);
const project = await fetch(new URL('./project/project.json', import.meta.url), { cache: 'no-store' }).then((response) => {
  if (!response.ok) throw new Error(`Projektstatus ${response.status}`);
  return response.json();
});

const sessionFields = ['accessKey', 'adminKey', 'apiUrl', 'baseUrl', 'model', 'apiKey'];
for (const id of sessionFields) {
  const input = document.getElementById(id);
  input.value = sessionStorage.getItem(`comic:${id}`) || '';
  input.addEventListener('input', () => sessionStorage.setItem(`comic:${id}`, input.value));
}

let health = { status: 'browser', checks: {} };
let proxyOnline = false;
const messages = JSON.parse(localStorage.getItem('comic:messages') || '[]');
if (!messages.length) messages.push({ role: 'assistant', content: 'Comic Director bereit. Aktive Linie: M1 Lebenszeichen. Feste Steuerbefehle und GitHub-Entwürfe funktionieren direkt im Browser. Für freie KI-Planung kannst du einen freigegebenen LLM-Provider oder einen sicheren Bot-Proxy eintragen.' });
let lastAssistant = messages.filter((item) => item.role === 'assistant').at(-1)?.content || '';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
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

function renderHealth() {
  $('#systemStatus').textContent = proxyOnline ? 'Dashboard + Proxy online' : 'Dashboard online';
  $('#healthUi').textContent = '✓ Dashboard im Browser einsatzbereit';
  $('#healthLlm').textContent = proxyOnline && health.checks?.llmConfigured ? '✓ LLM serverseitig konfiguriert' : '→ LLM über Browser-Key oder Proxy verbinden';
  $('#healthGithub').textContent = proxyOnline && health.checks?.githubWriteConfigured && health.checks?.adminProtection ? '✓ GitHub-Schreibweg automatisch geschützt' : '✓ GitHub-Arbeitspakete als bestätigbare Entwürfe';
  $('#botState').textContent = proxyOnline ? 'Sicherer Bot-Proxy erreichbar.' : 'Browser-Modus aktiv. Keine freie Shell und keine versteckten Schreibaktionen.';
}

function renderMetrics() {
  const done = project.milestones.filter((item) => item.state === 'done').length;
  $('#metrics').innerHTML = [
    ['DASHBOARD', 'ONLINE', 'Browser-Leitstand bereit'],
    ['BOT-PROXY', proxyOnline ? 'ONLINE' : 'OPTIONAL', proxyOnline ? `Version ${escapeHtml(health.version || '?')}` : 'Browser-Fallback aktiv'],
    ['MEILENSTEINE', `${done}/8`, 'M1 ist aktiv'],
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

renderTimeline();
renderCharacters();
renderTasks();
renderChat();
await probeHealth();
