const [truthResponse, candidateResponse] = await Promise.all([
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/canon-candidates.json', import.meta.url), { cache: 'no-store' })
]);

if (!truthResponse.ok || !candidateResponse.ok) throw new Error('LR1 truth files could not be loaded.');
const truth = await truthResponse.json();
const candidates = await candidateResponse.json();

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const systemStatus = document.querySelector('#systemStatus');
if (systemStatus) systemStatus.textContent = 'LR1 · Dashboard online';

const metrics = document.querySelector('#metrics');
if (metrics) {
  metrics.innerHTML = [
    ['LR0 TRUTH RESET', 'PASS', 'PR #37 · öffentlich bewiesen'],
    ['AKTIVES GATE', 'LR1', 'Issue #38 · menschliche Pilotentscheidung'],
    ['PRODUKTIONSAPP', 'ARCHIV', 'erhalten · noch nicht zurückgeführt'],
    ['PILOT-CANON', 'OFFEN', `${candidates.candidates.length} Kandidaten · keine Auswahl`],
    ['EVIDENCE', 'PARTIELL', 'quellgebunden · keine Prozentzahl'],
    ['VISUELLE MASTERS', '0/8', '0/4 Figuren · 0/4 Sets'],
    ['STIMMEN', '0/3', 'keine freigegebene Canon-Stimme'],
    ['FERTIGE EPISODE', 'NEIN', 'kein Finalexport vorhanden']
  ].map(([label, value, note]) => `<article><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`).join('');
}

const cockpitCards = document.querySelectorAll('#productionCockpit .cockpit-card');
if (cockpitCards[0]) {
  cockpitCards[0].innerHTML = '<span class="cockpit-kicker">AKTUELLE LINIE</span><strong>LR1 · Pilotentscheidung</strong><p>LR0 ist geschlossen. Jetzt werden vorhandene Kandidaten neutral verglichen, ohne Dateimenge oder Tests als kreative Freigabe zu missbrauchen.</p><div class="status-line"><span class="status-dot safe"></span><b>Nächstes Gate:</b> menschliche Auswahl dokumentieren</div>';
}
if (cockpitCards[3]) {
  cockpitCards[3].innerHTML = '<span class="cockpit-kicker">NÄCHSTE AUFGABEN</span><ol><li>Pilotkandidaten neutral vergleichen</li><li>menschliche Auswahl dokumentieren</li><li>Studio Foundation retten</li><li>Studio-bis-Restore-Loop im Fire Test beweisen</li></ol>';
}

const timeline = document.querySelector('#timeline');
if (timeline) {
  timeline.innerHTML = truth.nextSequence.map((item) => {
    const active = item.status.startsWith('active');
    const done = item.status === 'done';
    const state = active ? 'active' : done ? 'done' : 'locked';
    const label = done ? 'FERTIG' : active ? 'AKTIV' : 'GESPERRT';
    return `<div class="stage ${state}"><span class="stage-dot">${done ? '✓' : escapeHtml(item.id)}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.doneWhen)}</p></div><span class="stage-state">${label}</span></div>`;
  }).join('');
}

const tasks = document.querySelector('#tasks');
if (tasks) {
  tasks.innerHTML = `<div class="task-summary"><strong>LR1 aktiv</strong><span>${truth.nextSequence.length} kontrollierte Gates</span></div>${truth.nextSequence.map((item, index) => {
    const state = item.status === 'done' ? 'done' : item.status.startsWith('active') ? 'ready' : 'blocked';
    return `<article class="task-${state}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.doneWhen)}</p></div><em>${escapeHtml(item.status)}</em></article>`;
  }).join('')}`;
}
