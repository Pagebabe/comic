// Wait for the base dashboard before projecting the current recovery-line truth onto its DOM.
await import('./app.js');

const [truthResponse, candidateResponse, decisionResponse, foundationResponse, closureResponse] = await Promise.all([
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/canon-candidates.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/pilot-decision-record.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/studio-foundation-status.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/studio-foundation-closure.json', import.meta.url), { cache: 'no-store' })
]);

if (![truthResponse, candidateResponse, decisionResponse, foundationResponse, closureResponse].every((response) => response.ok)) throw new Error('Recovery-line truth files could not be loaded.');
const truth = await truthResponse.json();
const candidates = await candidateResponse.json();
const decision = await decisionResponse.json();
const foundation = await foundationResponse.json();
const foundationClosure = await closureResponse.json();

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const activeGate = truth.nextSequence.find((item) => item.status.startsWith('active'));

const topEyebrow = document.querySelector('.hero-copy .eyebrow');
if (topEyebrow) topEyebrow.textContent = 'COMIC FACTORY · LR3 PRODUKTIONSLOOP';
const topTitle = document.querySelector('.hero-copy h1');
if (topTitle) topTitle.innerHTML = 'Studio Foundation bewiesen.<br>Jetzt den echten Loop retten.';
const topText = document.querySelector('.hero-copy p');
if (topText) topText.textContent = 'LR0, LR1 und LR2 sind geschlossen. Die neutrale Vite-/React-/TypeScript-Foundation läuft öffentlich unter /studio/. Jetzt wird ausschließlich der kontrollierte Studio-bis-Restore-Loop mit einem neutralen Test-EpisodePackage gerettet.';

const systemStatus = document.querySelector('#systemStatus');
if (systemStatus) systemStatus.textContent = 'LR3 · Dashboard online';
const statusDetail = document.querySelector('.status-card div > span:last-child');
if (statusDetail) statusDetail.textContent = 'LR3 · Issue #60 · Foundation PROVEN';

const metrics = document.querySelector('#metrics');
if (metrics) {
  metrics.innerHTML = [
    ['LR0 TRUTH RESET', 'PASS', 'öffentlich bewiesen'],
    ['LR1 PILOTWAHL', 'PASS', 'Das Zimmer menschlich ausgewählt'],
    ['LR2 FOUNDATION', 'PASS', 'PR #59 · Pages 29148728164'],
    ['AKTIVES GATE', 'LR3', 'Issue #60 · Produktionsloop'],
    ['STUDIO-ROUTE', 'PROVEN', '/studio/ · Desktop und Mobil'],
    ['PILOT', 'DAS ZIMMER', 'Detail- und Asset-Gates offen'],
    ['VISUELLE MASTERS', '0/8', '0/4 Figuren · 0/4 Sets'],
    ['FERTIGE EPISODE', 'NEIN', 'kein Finalexport vorhanden']
  ].map(([label, value, note]) => `<article><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`).join('');
}

const cockpitCards = document.querySelectorAll('#productionCockpit .cockpit-card');
if (cockpitCards[0]) cockpitCards[0].innerHTML = '<span class="cockpit-kicker">AKTUELLE LINIE</span><strong>LR3 · Produktionsloop</strong><p>Die Foundation ist öffentlich bewiesen. Jetzt müssen Control, Studio, Queue, Import, Review, QA, Lettering, Package und Restore als ein neutraler Testpfad funktionieren.</p><div class="status-line"><span class="status-dot safe"></span><b>Nächstes Gate:</b> deterministischer Delete-and-Restore-Beweis</div>';
if (cockpitCards[1]) cockpitCards[1].innerHTML = `<span class="cockpit-kicker">BEWIESENE FOUNDATION</span><strong>/studio/ ist öffentlich</strong><p>PR #${foundationClosure.pullRequest.number}, Merge ${escapeHtml(foundationClosure.pullRequest.mergeCommit.slice(0, 12))}, Pages ${foundationClosure.deployment.runId}. Produktionsloop weiterhin offen.</p><a href="./studio/">Studio Foundation öffnen</a>`;
if (cockpitCards[2]) cockpitCards[2].innerHTML = '<span class="cockpit-kicker">TECHNISCHE GRENZE</span><strong>FOUNDATION PROVEN · LOOP OPEN</strong><p>Die Route baut, lädt Truth State und besteht Desktop sowie Mobil. Es gibt noch keinen bewiesenen Import-, QA-, Package- oder Restore-Zustand.</p><a href="./project/studio-foundation-closure.json">LR2 Closure öffnen</a>';
if (cockpitCards[3]) cockpitCards[3].innerHTML = '<span class="cockpit-kicker">NÄCHSTE AUFGABEN</span><ol><li>Archivmodule einzeln inventarisieren</li><li>neutralen EpisodePackage-Vertrag definieren</li><li>Loop-Stationen atomar verbinden</li><li>Zustand löschen und hashgleich restaurieren</li></ol>';

const botPanel = document.querySelector('.bot-panel');
if (botPanel) {
  const heading = botPanel.querySelector('.section-head h2');
  const badge = botPanel.querySelector('.section-head .badge');
  const textarea = botPanel.querySelector('#messageInput');
  const commands = botPanel.querySelector('.command-row');
  if (heading) heading.textContent = 'Produktionsloop planen, nicht das Archiv ausschütten';
  if (badge) badge.textContent = 'LR3 aktiv';
  if (textarea) textarea.placeholder = 'Zum Beispiel: Welcher minimale EpisodePackage-Vertrag verbindet Import, QA, Package und Restore?';
  if (commands) commands.innerHTML = '<button data-prompt="/status">Wahrheitsstatus</button><button data-prompt="/next">Nächster Schritt</button><button data-prompt="/characters">Pilotcast</button><button data-prompt="/plan">Rettungsplan</button><button data-prompt="Prüfe ausschließlich den kleinsten neutralen Studio-bis-Restore-Loop im Archiv. Kein Blind-Merge und keine externe Ausführung.">Loop prüfen</button>';
}

const firstBotMessage = document.querySelector('#chat .message.bot');
if (firstBotMessage && /Line Reset|LR2|Pilot-Canon ist nicht ausgewählt/.test(firstBotMessage.textContent || '')) firstBotMessage.textContent = 'Comic Director bereit. LR0, LR1 und LR2 sind geschlossen. Das Zimmer ist ausgewählt, die Studio Foundation ist öffentlich bewiesen und LR3 Issue #60 ist aktiv. Ich darf den neutralen Produktionsloop planen und prüfen, aber keine Bilder, externen Jobs oder kreative Freigaben auslösen.';

const characterBoard = document.querySelector('.character-board');
if (characterBoard) {
  const eyebrow = characterBoard.querySelector('.eyebrow');
  const heading = characterBoard.querySelector('h2');
  if (eyebrow) eyebrow.textContent = 'AUSGEWÄHLTER PILOTCAST';
  if (heading) heading.textContent = 'Ricco, Basti, Jule und Don Miau · Detail- und Visual-Gates offen';
}
const characterSummary = document.querySelector('.character-summary');
if (characterSummary) characterSummary.innerHTML = '<div><span class="character-state">AUSGEWÄHLTER PILOTCAST · DETAILREVIEW OFFEN</span><h3>Figurenrichtung gewählt · Visuals bleiben unbewiesen</h3><p>Ricco, Basti, Jule und Don Miau gehören zu „Das Zimmer“. LR3 testet nur den Produktionsloop und genehmigt weder Bibles noch Masterreferenzen.</p></div><div class="summary-stats"><span><b>4</b> Kernpläne</span><span><b>13</b> Quellenfiguren</span><span class="open"><b>0/4</b> Masterreferenzen</span></div>';
for (const node of document.querySelectorAll('.core-card .character-state')) node.textContent = 'AUSGEWÄHLTER PILOTCAST · DETAILREVIEW OFFEN';
for (const footer of document.querySelectorAll('.core-card .card-footer')) footer.innerHTML = '<span>Textplan vorhanden</span><span>Visual und Detail offen</span>';

const proofGridPanels = document.querySelectorAll('.proof-grid > .panel');
if (proofGridPanels[1]) {
  const eyebrow = proofGridPanels[1].querySelector('.eyebrow');
  const heading = proofGridPanels[1].querySelector('h2');
  const badge = proofGridPanels[1].querySelector('.badge');
  if (eyebrow) eyebrow.textContent = 'JETZT';
  if (heading) heading.textContent = 'Nur Module des neutralen LR3-Produktionsloops';
  if (badge) badge.textContent = 'Kein Growth OS · keine Bildgenerierung';
}

const timeline = document.querySelector('#timeline');
if (timeline) timeline.innerHTML = truth.nextSequence.map((item) => {
  const active = item.status.startsWith('active');
  const done = item.status === 'done';
  const state = active ? 'active' : done ? 'done' : 'locked';
  const label = done ? 'FERTIG' : active ? 'AKTIV' : 'GESPERRT';
  return `<div class="stage ${state}"><span class="stage-dot">${done ? '✓' : escapeHtml(item.id)}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.doneWhen)}</p></div><span class="stage-state">${label}</span></div>`;
}).join('');

const tasks = document.querySelector('#tasks');
if (tasks) tasks.innerHTML = `<div class="task-summary"><strong>LR3 aktiv</strong><span>${truth.nextSequence.length} kontrollierte Gates</span></div>${truth.nextSequence.map((item, index) => {
  const state = item.status === 'done' ? 'done' : item.status.startsWith('active') ? 'ready' : 'blocked';
  return `<article class="task-${state}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.doneWhen)}</p></div><em>${escapeHtml(item.status)}</em></article>`;
}).join('')}`;

const gateCard = document.querySelector('.gate-card');
if (gateCard) gateCard.innerHTML = '<span class="eyebrow">NÄCHSTER HALT</span><h2>Neutralen Produktionsloop retten.<br>Dann Das Zimmer im Fire Test.</h2><p>LR3 nutzt synthetische Testdaten. LR4 nutzt erst danach den ausgewählten Pilot. Technik und kreative Freigabe bleiben getrennt.</p><div class="gate-list"><span>✓ Truth Reset geschlossen</span><span>✓ „Das Zimmer“ ausgewählt</span><span>✓ Studio Foundation öffentlich bewiesen</span><span>✓ LR3 Issue #60 eröffnet</span><span>□ EpisodePackage-Vertrag festgelegt</span><span>□ neun Loop-Stationen verbunden</span><span>□ Zustand gelöscht</span><span>□ hashgleich restauriert</span></div>';

const sourcesPanel = document.querySelector('.artifact-links')?.closest('.panel');
if (sourcesPanel) {
  const heading = sourcesPanel.querySelector('h2');
  const badge = sourcesPanel.querySelector('.badge');
  if (heading) heading.textContent = 'Wahrheit, LR2-Abschluss und LR3-Arbeitslinie';
  if (badge) badge.textContent = 'Produktionsloop noch nicht bewiesen';
}
const sourceLinks = document.querySelector('.artifact-links');
if (sourceLinks) sourceLinks.insertAdjacentHTML('afterbegin', '<a href="./studio/"><strong>Studio Foundation live</strong><span>öffentliche Vite-/React-/TypeScript-Route</span></a><a href="./project/studio-foundation-closure.json"><strong>LR2 Closure</strong><span>PR, CI, Deploy und Screenshot-Hashes</span></a><a href="https://github.com/Pagebabe/comic/issues/60"><strong>LR3 Issue #60</strong><span>neutraler Studio-bis-Restore-Loop</span></a>');

const footer = document.querySelector('footer');
if (footer) footer.textContent = 'Comic Factory · LR2 bewiesen · LR3 Produktionsloop aktiv · keine kreative Freigabe aus Technik';

if (decision.selectedCandidateId !== 'pilot-das-zimmer' || candidates.selectedCandidateId !== 'pilot-das-zimmer') throw new Error('Human pilot selection is not consistent.');
if (foundation.status !== 'public_build_verified_closed' || foundationClosure.status !== 'closed_verified') throw new Error('LR2 Foundation closure is not consistent.');
if (activeGate?.id !== 'LR3' || activeGate?.trackingIssue !== 60) throw new Error('LR3 is not the single active gate.');
