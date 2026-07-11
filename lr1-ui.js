// Wait for the base dashboard before projecting the current recovery-line truth onto its DOM.
await import('./app.js');

const [truthResponse, candidateResponse, decisionResponse, foundationResponse, foundationClosureResponse, loopClosureResponse] = await Promise.all([
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/canon-candidates.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/pilot-decision-record.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/studio-foundation-status.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/studio-foundation-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lr3-production-loop-closure.json', import.meta.url), { cache: 'no-store' })
]);

if (![truthResponse, candidateResponse, decisionResponse, foundationResponse, foundationClosureResponse, loopClosureResponse].every((response) => response.ok)) throw new Error('Recovery-line truth files could not be loaded.');
const truth = await truthResponse.json();
const candidates = await candidateResponse.json();
const decision = await decisionResponse.json();
const foundation = await foundationResponse.json();
const foundationClosure = await foundationClosureResponse.json();
const loopClosure = await loopClosureResponse.json();

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const activeGate = truth.nextSequence.find((item) => item.status.startsWith('active'));

const topEyebrow = document.querySelector('.hero-copy .eyebrow');
if (topEyebrow) topEyebrow.textContent = 'COMIC FACTORY · LR4 SELECTED-PILOT-FIRE-TEST';
const topTitle = document.querySelector('.hero-copy h1');
if (topTitle) topTitle.innerHTML = 'Neutraler Produktionsloop bewiesen.<br>Jetzt Das Zimmer durchfeuern.';
const topText = document.querySelector('.hero-copy p');
if (topText) topText.textContent = 'LR0 bis LR3 sind geschlossen. Der neutrale Studio-bis-Restore-Loop bestand neun Stationen, echte Zustandslöschung und hashgleichen Restore. Jetzt wird ausschließlich das ausgewählte Das-Zimmer-Paket quellengebunden durch denselben Pfad geführt.';

const systemStatus = document.querySelector('#systemStatus');
if (systemStatus) systemStatus.textContent = 'LR4 · Dashboard online';
const statusDetail = document.querySelector('.status-card div > span:last-child');
if (statusDetail) statusDetail.textContent = 'LR4 · Issue #76 · LR3 PROVEN';

const metrics = document.querySelector('#metrics');
if (metrics) {
  metrics.innerHTML = [
    ['LR0 TRUTH RESET', 'PASS', 'öffentlich bewiesen'],
    ['LR1 PILOTWAHL', 'PASS', 'Das Zimmer menschlich ausgewählt'],
    ['LR2 FOUNDATION', 'PASS', 'PR #59 · Pages 29148728164'],
    ['LR3 LOOP', 'PASS', '9/9 · Delete + Restore · Pages 29150875221'],
    ['AKTIVES GATE', 'LR4', 'Issue #76 · Das-Zimmer-Fire-Test'],
    ['PILOT', 'DAS ZIMMER', 'Detail- und Asset-Gates offen'],
    ['VISUELLE MASTERS', '0/8', '0/4 Figuren · 0/4 Sets'],
    ['FERTIGE EPISODE', 'NEIN', 'kein Finalexport vorhanden']
  ].map(([label, value, note]) => `<article><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`).join('');
}

const cockpitCards = document.querySelectorAll('#productionCockpit .cockpit-card');
if (cockpitCards[0]) cockpitCards[0].innerHTML = '<span class="cockpit-kicker">AKTUELLE LINIE</span><strong>LR4 · Das-Zimmer-Fire-Test</strong><p>Der neutrale Loop ist öffentlich bewiesen. Jetzt muss das ausgewählte Pilotpaket mit klarer Quellenbindung denselben Import-, Review-, QA-, Lettering-, Package-, Delete- und Restore-Pfad bestehen.</p><div class="status-line"><span class="status-dot safe"></span><b>Nächstes Gate:</b> SelectedPilotEpisodePackage</div>';
if (cockpitCards[1]) cockpitCards[1].innerHTML = `<span class="cockpit-kicker">BEWIESENER LOOP</span><strong>9/9 Stationen · HASH MATCH</strong><p>PR #${loopClosure.implementedBy.pullRequest}, Merge ${escapeHtml(loopClosure.implementedBy.mergeCommit.slice(0, 12))}, Pages ${loopClosure.publicProof.pagesRun}. Selected-Pilot-Fire-Test weiterhin offen.</p><a href="./studio/#loop">Neutralen Loop öffnen</a>`;
if (cockpitCards[2]) cockpitCards[2].innerHTML = '<span class="cockpit-kicker">TECHNISCHE GRENZE</span><strong>LOOP PROVEN · PILOT OPEN</strong><p>LR3 beweist Transport, Löschung und Restore mit synthetischen Metadaten. Es genehmigt keine Dialoge, Bilder, Stimmen, Timing- oder Episodenfassung.</p><a href="./project/lr3-production-loop-closure.json">LR3 Closure öffnen</a>';
if (cockpitCards[3]) cockpitCards[3].innerHTML = '<span class="cockpit-kicker">NÄCHSTE AUFGABEN</span><ol><li>Das-Zimmer-Quellen einzeln inventarisieren</li><li>SelectedPilotEpisodePackage definieren</li><li>alle Details REVIEW_REQUIRED halten</li><li>Zustand löschen und hashgleich restaurieren</li></ol>';

const botPanel = document.querySelector('.bot-panel');
if (botPanel) {
  const heading = botPanel.querySelector('.section-head h2');
  const badge = botPanel.querySelector('.section-head .badge');
  const textarea = botPanel.querySelector('#messageInput');
  const commands = botPanel.querySelector('.command-row');
  if (heading) heading.textContent = 'Das Zimmer transportieren, nicht heimlich finalisieren';
  if (badge) badge.textContent = 'LR4 aktiv';
  if (textarea) textarea.placeholder = 'Zum Beispiel: Welche Das-Zimmer-Quellen dürfen als REVIEW_REQUIRED in das Pilotpaket?';
  if (commands) commands.innerHTML = '<button data-prompt="/status">Wahrheitsstatus</button><button data-prompt="/next">Nächster Schritt</button><button data-prompt="/characters">Pilotcast</button><button data-prompt="/plan">Rettungsplan</button><button data-prompt="Inventarisiere nur autorisierte Das-Zimmer-Quellen für LR4. Keine Bilder, Stimmen oder Detailfreigaben.">LR4 prüfen</button>';
}

const firstBotMessage = document.querySelector('#chat .message.bot');
if (firstBotMessage) firstBotMessage.textContent = 'Comic Director bereit. LR0 bis LR3 sind geschlossen. Das Zimmer ist ausgewählt und der neutrale Produktionsloop ist öffentlich bewiesen. LR4 Issue #76 ist aktiv. Ich darf das ausgewählte Pilotpaket technisch prüfen und transportieren, aber keine Bilder, Stimmen, Dialoge, Timing- oder Finalfreigaben erteilen.';

const characterBoard = document.querySelector('.character-board');
if (characterBoard) {
  const eyebrow = characterBoard.querySelector('.eyebrow');
  const heading = characterBoard.querySelector('h2');
  if (eyebrow) eyebrow.textContent = 'AUSGEWÄHLTER PILOTCAST';
  if (heading) heading.textContent = 'Ricco, Basti, Jule und Don Miau · Detail- und Visual-Gates offen';
}
const characterSummary = document.querySelector('.character-summary');
if (characterSummary) characterSummary.innerHTML = '<div><span class="character-state">AUSGEWÄHLTER PILOTCAST · DETAILREVIEW OFFEN</span><h3>Figurenrichtung gewählt · Visuals bleiben unbewiesen</h3><p>Ricco, Basti, Jule und Don Miau gehören zu „Das Zimmer“. LR4 transportiert nur das ausgewählte Paket und genehmigt weder Bibles noch Masterreferenzen.</p></div><div class="summary-stats"><span><b>4</b> Kernpläne</span><span><b>13</b> Quellenfiguren</span><span class="open"><b>0/4</b> Masterreferenzen</span></div>';
for (const node of document.querySelectorAll('.core-card .character-state')) node.textContent = 'AUSGEWÄHLTER PILOTCAST · DETAILREVIEW OFFEN';
for (const footer of document.querySelectorAll('.core-card .card-footer')) footer.innerHTML = '<span>Textplan vorhanden</span><span>Visual und Detail offen</span>';

const proofGridPanels = document.querySelectorAll('.proof-grid > .panel');
if (proofGridPanels[1]) {
  const eyebrow = proofGridPanels[1].querySelector('.eyebrow');
  const heading = proofGridPanels[1].querySelector('h2');
  const badge = proofGridPanels[1].querySelector('.badge');
  if (eyebrow) eyebrow.textContent = 'JETZT';
  if (heading) heading.textContent = 'Nur der quellengebundene LR4-Pilotpaket-Fire-Test';
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
if (tasks) tasks.innerHTML = `<div class="task-summary"><strong>LR4 aktiv</strong><span>${truth.nextSequence.length} kontrollierte Gates</span></div>${truth.nextSequence.map((item, index) => {
  const state = item.status === 'done' ? 'done' : item.status.startsWith('active') ? 'ready' : 'blocked';
  return `<article class="task-${state}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.doneWhen)}</p></div><em>${escapeHtml(item.status)}</em></article>`;
}).join('')}`;

const gateCard = document.querySelector('.gate-card');
if (gateCard) gateCard.innerHTML = '<span class="eyebrow">NÄCHSTER HALT</span><h2>Das Zimmer durch den bewiesenen Loop.<br>Ohne kreative Abkürzung.</h2><p>LR4 nutzt ausgewählte Pilot-Quelldaten, hält aber jedes Detail auf REVIEW_REQUIRED. Technik und kreative Freigabe bleiben getrennt.</p><div class="gate-list"><span>✓ Truth Reset geschlossen</span><span>✓ „Das Zimmer“ ausgewählt</span><span>✓ Studio Foundation öffentlich bewiesen</span><span>✓ LR3 Delete-and-Restore öffentlich bewiesen</span><span>✓ LR4 Issue #76 eröffnet</span><span>□ Quelleninventar gebunden</span><span>□ SelectedPilotEpisodePackage gebaut</span><span>□ Zustand gelöscht und hashgleich restauriert</span></div>';

const sourcesPanel = document.querySelector('.artifact-links')?.closest('.panel');
if (sourcesPanel) {
  const heading = sourcesPanel.querySelector('h2');
  const badge = sourcesPanel.querySelector('.badge');
  if (heading) heading.textContent = 'Wahrheit, LR3-Abschluss und LR4-Arbeitslinie';
  if (badge) badge.textContent = 'Selected-Pilot-Fire-Test noch offen';
}
const sourceLinks = document.querySelector('.artifact-links');
if (sourceLinks) sourceLinks.insertAdjacentHTML('afterbegin', '<a href="./studio/#loop"><strong>Neutraler Loop live</strong><span>9/9 Stationen · Delete + Restore</span></a><a href="./project/lr3-production-loop-closure.json"><strong>LR3 Closure</strong><span>PR, CI, Pages und SHA-256-Beweise</span></a><a href="https://github.com/Pagebabe/comic/issues/76"><strong>LR4 Issue #76</strong><span>Das-Zimmer-Paket-Fire-Test</span></a>');

const footer = document.querySelector('footer');
if (footer) footer.textContent = 'Comic Factory · LR3 bewiesen · LR4 Selected-Pilot-Fire-Test aktiv · keine kreative Freigabe aus Technik';

if (decision.selectedCandidateId !== 'pilot-das-zimmer' || candidates.selectedCandidateId !== 'pilot-das-zimmer') throw new Error('Human pilot selection is not consistent.');
if (foundation.status !== 'public_build_verified_closed' || foundationClosure.status !== 'closed_verified') throw new Error('LR2 Foundation closure is not consistent.');
if (loopClosure.status !== 'closed_verified' || loopClosure.nextGate?.trackingIssue !== 76) throw new Error('LR3 closure is not consistent.');
if (activeGate?.id !== 'LR4' || activeGate?.trackingIssue !== 76) throw new Error('LR4 is not the single active gate.');
