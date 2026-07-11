// Wait for the base dashboard before projecting the current recovery-line truth onto its DOM.
await import('./app.js');

const [truthResponse, candidateResponse, decisionResponse] = await Promise.all([
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/canon-candidates.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/pilot-decision-record.json', import.meta.url), { cache: 'no-store' })
]);

if (!truthResponse.ok || !candidateResponse.ok || !decisionResponse.ok) throw new Error('Recovery-line truth files could not be loaded.');
const truth = await truthResponse.json();
const candidates = await candidateResponse.json();
const decision = await decisionResponse.json();

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const topEyebrow = document.querySelector('.hero-copy .eyebrow');
if (topEyebrow) topEyebrow.textContent = 'COMIC FACTORY · LR2 STUDIO FOUNDATION';
const topTitle = document.querySelector('.hero-copy h1');
if (topTitle) topTitle.innerHTML = '„Das Zimmer“ ist ausgewählt.<br>Jetzt Produktionsfunktion retten.';
const topText = document.querySelector('.hero-copy p');
if (topText) topText.textContent = 'LR0 und LR1 sind geschlossen. Der Projektinhaber hat „Das Zimmer“ ausdrücklich als Pilot gewählt. Das aktuelle main bleibt noch eine Audit- und Status-Shell; jetzt wird die neutrale Vite-/React-Studio-Foundation atomar aus dem Archiv zurückgeführt.';

const systemStatus = document.querySelector('#systemStatus');
if (systemStatus) systemStatus.textContent = 'LR2 · Dashboard online';
const statusDetail = document.querySelector('.status-card div > span:last-child');
if (statusDetail) statusDetail.textContent = 'LR2 · Issue #45 · Pilot DAS ZIMMER';

const metrics = document.querySelector('#metrics');
if (metrics) {
  metrics.innerHTML = [
    ['LR0 TRUTH RESET', 'PASS', 'öffentlich bewiesen'],
    ['LR1 PILOTWAHL', 'PASS', 'Das Zimmer menschlich ausgewählt'],
    ['AKTIVES GATE', 'LR2', 'Issue #45 · Studio Foundation'],
    ['PRODUKTIONSAPP', 'ARCHIV', 'erhalten · noch nicht zurückgeführt'],
    ['PILOT', 'DAS ZIMMER', 'Detail- und Asset-Gates offen'],
    ['EVIDENCE', 'PARTIELL', 'quellgebunden · keine Prozentzahl'],
    ['VISUELLE MASTERS', '0/8', '0/4 Figuren · 0/4 Sets'],
    ['FERTIGE EPISODE', 'NEIN', 'kein Finalexport vorhanden']
  ].map(([label, value, note]) => `<article><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`).join('');
}

const cockpitCards = document.querySelectorAll('#productionCockpit .cockpit-card');
if (cockpitCards[0]) {
  cockpitCards[0].innerHTML = '<span class="cockpit-kicker">AKTUELLE LINIE</span><strong>LR2 · Studio Foundation</strong><p>„Das Zimmer“ ist ausgewählt. Jetzt wird ausschließlich die neutrale Vite-/React-Grundlage atomar aus dem Archiv gerettet.</p><div class="status-line"><span class="status-dot safe"></span><b>Nächstes Gate:</b> getestete Studio-Route</div>';
}
if (cockpitCards[3]) {
  cockpitCards[3].innerHTML = '<span class="cockpit-kicker">NÄCHSTE AUFGABEN</span><ol><li>Archiv-Foundation inventarisieren</li><li>minimalen Studio-Slice definieren</li><li>Vite-/React-Build herstellen</li><li>Browser-Smoke-Test beweisen</li></ol>';
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
  tasks.innerHTML = `<div class="task-summary"><strong>LR2 aktiv</strong><span>${truth.nextSequence.length} kontrollierte Gates</span></div>${truth.nextSequence.map((item, index) => {
    const state = item.status === 'done' ? 'done' : item.status.startsWith('active') ? 'ready' : 'blocked';
    return `<article class="task-${state}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.doneWhen)}</p></div><em>${escapeHtml(item.status)}</em></article>`;
  }).join('')}`;
}

const gateCard = document.querySelector('.gate-card');
if (gateCard) gateCard.innerHTML = '<span class="eyebrow">NÄCHSTER HALT</span><h2>Neutrale Studio-Foundation retten.<br>Dann Produktionsloop zurückholen.</h2><p>Kein Blind-Merge. Zuerst nur Vite-/React-Grundlage und getestete Studio-Route.</p><div class="gate-list"><span>✓ Truth Reset geschlossen</span><span>✓ „Das Zimmer“ ausgewählt</span><span>✓ „Der Solidarpreis“ archiviert</span><span>✓ LR2 Issue #45 eröffnet</span><span>□ Archiv-Foundation inventarisiert</span><span>□ Studio Foundation zurückgeführt</span><span>□ Build und Browser-Smoke grün</span><span>□ Produktionsloop gerettet</span></div>';

const sourceLinks = document.querySelector('.artifact-links');
if (sourceLinks) {
  sourceLinks.insertAdjacentHTML('afterbegin', '<a href="./project/pilot-decision-record.json"><strong>Pilot Decision Record</strong><span>Das Zimmer menschlich ausgewählt</span></a><a href="./docs/PILOT_DECISION_RECORD_2026-07-11.md"><strong>Pilot-Entscheidungsprotokoll</strong><span>Freigabegrenzen und LR2-Wechsel</span></a>');
}

if (decision.selectedCandidateId !== 'pilot-das-zimmer' || candidates.selectedCandidateId !== 'pilot-das-zimmer') throw new Error('Human pilot selection is not consistent.');
