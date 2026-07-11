// Wait for the base dashboard before projecting the current recovery-line truth onto its DOM.
await import('./app.js');

const [truthResponse, candidateResponse, decisionResponse, foundationResponse, foundationClosureResponse, loopClosureResponse, pilotClosureResponse, riccoInventoryResponse, riccoContractResponse] = await Promise.all([
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/canon-candidates.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/pilot-decision-record.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/studio-foundation-status.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/studio-foundation-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lr3-production-loop-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lr4-selected-pilot-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lr5-ricco-master-source-inventory.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lr5-ricco-master-contract.json', import.meta.url), { cache: 'no-store' })
]);

if (![truthResponse, candidateResponse, decisionResponse, foundationResponse, foundationClosureResponse, loopClosureResponse, pilotClosureResponse, riccoInventoryResponse, riccoContractResponse].every((response) => response.ok)) throw new Error('Recovery-line truth files could not be loaded.');
const truth = await truthResponse.json();
const candidates = await candidateResponse.json();
const decision = await decisionResponse.json();
const foundation = await foundationResponse.json();
const foundationClosure = await foundationClosureResponse.json();
const loopClosure = await loopClosureResponse.json();
const pilotClosure = await pilotClosureResponse.json();
const riccoInventory = await riccoInventoryResponse.json();
const riccoContract = await riccoContractResponse.json();

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const activeGate = truth.nextSequence.find((item) => item.status.startsWith('active'));
const activeWorkPackage = truth.activeWorkPackage;

const topEyebrow = document.querySelector('.hero-copy .eyebrow');
if (topEyebrow) topEyebrow.textContent = 'COMIC FACTORY · LR5.1 RICCO MASTER-VERTRAG';
const topTitle = document.querySelector('.hero-copy h1');
if (topTitle) topTitle.innerHTML = 'Ein Ricco.<br>Noch kein Bilderroulette.';
const topText = document.querySelector('.hero-copy p');
if (topText) topText.textContent = 'LR0 bis LR4 sind öffentlich geschlossen. LR5.1 bindet jetzt sieben Ricco-Quellen, fünf historische Konflikte und zehn Reviewtests. Der Kandidatenstand bleibt 0/1; Bildgenerierung ist bis CONTRACT_APPROVED_FOR_ONE_CANDIDATE gesperrt.';

const systemStatus = document.querySelector('#systemStatus');
if (systemStatus) systemStatus.textContent = 'LR5.1 · Vertrag online';
const statusDetail = document.querySelector('.status-card div > span:last-child');
if (statusDetail) statusDetail.textContent = 'LR5.1 · Issue #88 · EXECUTION BLOCKED';

const metrics = document.querySelector('#metrics');
if (metrics) {
  metrics.innerHTML = [
    ['LR0 TRUTH RESET', 'PASS', 'öffentlich bewiesen'],
    ['LR1 PILOTWAHL', 'PASS', 'Das Zimmer menschlich ausgewählt'],
    ['LR2 FOUNDATION', 'PASS', 'PR #59 · Pages 29148728164'],
    ['LR3 LOOP', 'PASS', '9/9 · Delete + Restore · Pages 29150875221'],
    ['LR4 PILOT FIRE TEST', 'PASS', 'CLOSED_VERIFIED · Pages 29154561431'],
    ['AKTIVES GATE', 'LR5', 'Issue #82 · Visual-, Set- und Voice-Locks'],
    ['AKTIVES WORK PACKAGE', 'LR5.1', 'Issue #88 · Ricco-Vertrag'],
    ['RICCO KANDIDATEN', '0/1', 'CONTRACT_READY_REVIEW_REQUIRED'],
    ['BILDGENERIERUNG', 'GESPERRT', 'menschliche Vertragsfreigabe fehlt'],
    ['VISUELLE MASTERS', '0/8', '0/4 Figuren · 0/4 Sets'],
    ['FERTIGE EPISODE', 'NEIN', 'kein Finalexport vorhanden']
  ].map(([label, value, note]) => `<article><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`).join('');
}

const cockpitCards = document.querySelectorAll('#productionCockpit .cockpit-card');
if (cockpitCards[0]) cockpitCards[0].innerHTML = '<span class="cockpit-kicker">EINZIG AKTIV</span><strong>LR5.1 · Ricco Master-Vertrag</strong><p>Sieben Quellen, fünf Konflikte, fünf Ansichten, sechs Expressions und zehn Reviewtests. Noch kein Bild und kein Master.</p><div class="status-line"><span class="status-dot safe"></span><b>Status:</b> CONTRACT_READY_REVIEW_REQUIRED</div>';
if (cockpitCards[1]) cockpitCards[1].innerHTML = `<span class="cockpit-kicker">LR4 BEWIESEN</span><strong>9/9 Stationen · HASH MATCH</strong><p>Aktueller öffentlicher Abschluss: Merge 56a4e9da2d9c, Pages 29154561431. LR4 genehmigt weiterhin keine Visuals oder Stimmen.</p><a href="./studio/#pilot-fire-test">Das-Zimmer-Fire-Test öffnen</a>`;
if (cockpitCards[2]) cockpitCards[2].innerHTML = '<span class="cockpit-kicker">LR5.1 GRENZE</span><strong>0/1 · EXECUTION BLOCKED</strong><p>Bildgenerierung, Batch, LoRA und automatische Masterfreigabe bleiben gesperrt. Das Dashboard-SVG ist keine Masterquelle.</p><a href="./studio/#lr5-ricco">Ricco-Vertrag öffnen</a>';
if (cockpitCards[3]) cockpitCards[3].innerHTML = '<span class="cockpit-kicker">NÄCHSTE AUFGABEN</span><ol><li>Vertrag durch CI prüfen</li><li>Desktop und Mobil sichtbar prüfen</li><li>Pages-Gegenbeweis veröffentlichen</li><li>menschliche Vertragsentscheidung abwarten</li></ol>';

const botPanel = document.querySelector('.bot-panel');
if (botPanel) {
  const heading = botPanel.querySelector('.section-head h2');
  const badge = botPanel.querySelector('.section-head .badge');
  const textarea = botPanel.querySelector('#messageInput');
  const commands = botPanel.querySelector('.command-row');
  if (heading) heading.textContent = 'Ricco-Vertrag prüfen, noch nicht rendern';
  if (badge) badge.textContent = 'LR5.1 · gesperrt';
  if (textarea) textarea.placeholder = 'Zum Beispiel: Welche Konflikte wurden im Ricco-Vertrag aufgelöst?';
  if (commands) commands.innerHTML = '<button data-prompt="/status">Wahrheitsstatus</button><button data-prompt="/next">Nächster Schritt</button><button data-prompt="/characters">Pilotcast</button><button data-prompt="/plan">Rettungsplan</button><button data-prompt="Prüfe den LR5.1 Ricco-Vertrag. Keine Bildgenerierung.">Vertrag prüfen</button>';
}

const firstBotMessage = document.querySelector('#chat .message.bot');
if (firstBotMessage) firstBotMessage.textContent = 'Comic Director bereit. LR0 bis LR4 sind öffentlich geschlossen. LR5.1 Issue #88 ist das einzige aktive Arbeitspaket. Der Ricco-Vertrag steht auf REVIEW_REQUIRED und 0/1 Kandidat. Ich darf den Vertrag prüfen, aber keine Bild-, GPU-, Provider- oder LoRA-Ausführung starten.';

const characterBoard = document.querySelector('.character-board');
if (characterBoard) {
  const eyebrow = characterBoard.querySelector('.eyebrow');
  const heading = characterBoard.querySelector('h2');
  if (eyebrow) eyebrow.textContent = 'LR5.1 · AUSGEWÄHLTER PILOTCAST';
  if (heading) heading.textContent = 'Ricco-Vertrag zuerst · übrige Master bleiben blockiert';
}
const characterSummary = document.querySelector('.character-summary');
if (characterSummary) characterSummary.innerHTML = '<div><span class="character-state">LR5.1 CONTRACT READY · EXECUTION BLOCKED</span><h3>Ricco 0/1 Kandidat · Masterreferenzen 0/4</h3><p>Ricco, Basti, Jule und Don Miau gehören zu „Das Zimmer“. Nur Riccos Vertrag ist aktiv. Das sichtbare Ricco-SVG bleibt ein Dashboard-Platzhalter und kein Masterinput.</p></div><div class="summary-stats"><span><b>7</b> Ricco-Quellen</span><span><b>10</b> Reviewtests</span><span class="open"><b>0/4</b> Masterreferenzen</span></div>';
for (const node of document.querySelectorAll('.core-card .character-state')) node.textContent = 'LR5 · MASTERREVIEW BLOCKIERT';
const firstCoreState = document.querySelector('.core-card .character-state');
if (firstCoreState) firstCoreState.textContent = 'LR5.1 · VERTRAG REVIEW_REQUIRED';
for (const footer of document.querySelectorAll('.core-card .card-footer')) footer.innerHTML = '<span>Textplan vorhanden</span><span>Visual und Detail REVIEW_REQUIRED</span>';

const proofGridPanels = document.querySelectorAll('.proof-grid > .panel');
if (proofGridPanels[1]) {
  const eyebrow = proofGridPanels[1].querySelector('.eyebrow');
  const heading = proofGridPanels[1].querySelector('h2');
  const badge = proofGridPanels[1].querySelector('.badge');
  if (eyebrow) eyebrow.textContent = 'JETZT';
  if (heading) heading.textContent = 'Nur den source-bound Ricco-Vertrag öffentlich beweisen';
  if (badge) badge.textContent = '0 Bildbytes · keine Ausführung · keine Freigabe';
}

const timeline = document.querySelector('#timeline');
if (timeline) timeline.innerHTML = truth.nextSequence.map((item) => {
  const active = item.status.startsWith('active');
  const done = item.status === 'done';
  const state = active ? 'active' : done ? 'done' : 'locked';
  const label = done ? 'FERTIG' : active ? 'AKTIV' : 'GESPERRT';
  const detail = active && activeWorkPackage ? `${item.doneWhen} Aktives Work Package: ${activeWorkPackage.id}, Issue #${activeWorkPackage.trackingIssue}, ${activeWorkPackage.status}.` : item.doneWhen;
  return `<div class="stage ${state}"><span class="stage-dot">${done ? '✓' : escapeHtml(item.id)}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(detail)}</p></div><span class="stage-state">${label}</span></div>`;
}).join('');

const tasks = document.querySelector('#tasks');
if (tasks) tasks.innerHTML = `<div class="task-summary"><strong>LR5.1 aktiv</strong><span>Issue #88 · 0/1 · Execution blocked</span></div><article class="task-ready"><span>01</span><div><strong>Ricco Quellen- und Mastervertrag</strong><p>7 Quellen · 5 Konflikte · 10 Tests · keine Bildgenerierung vor CONTRACT_APPROVED_FOR_ONE_CANDIDATE.</p></div><em>contract_review_required</em></article><article class="task-blocked"><span>02</span><div><strong>Ein Ricco-Kandidat</strong><p>Blockiert bis zur menschlichen Vertragsfreigabe.</p></div><em>blocked</em></article><article class="task-blocked"><span>03</span><div><strong>Weitere Master</strong><p>Basti, Jule, Don Miau, Sets und Stimmen bleiben blockiert.</p></div><em>blocked</em></article>`;

const gateCard = document.querySelector('.gate-card');
if (gateCard) gateCard.innerHTML = '<span class="eyebrow">NÄCHSTER HALT</span><h2>Vertrag beweisen.<br>Noch kein Ricco-Bild erzeugen.</h2><p>Der LR5.1-Vertrag muss zuerst auf Desktop, Mobil und Pages sichtbar grün sein. Danach kann der Projektinhaber genau einen Kandidaten ausdrücklich erlauben.</p><div class="gate-list"><span>✓ LR0 bis LR4 öffentlich geschlossen</span><span>✓ LR5 Issue #82 aktiv</span><span>✓ LR5.1 Issue #88 angelegt</span><span>✓ 7 Quellen und 5 Konflikte gebunden</span><span>✓ 10 Reviewtests definiert</span><span>□ öffentlicher Vertragsbeweis</span><span>□ CONTRACT_APPROVED_FOR_ONE_CANDIDATE</span><span>□ erster Ricco-Kandidat</span><span>□ menschliche Masterentscheidung</span></div>';

const sourcesPanel = document.querySelector('.artifact-links')?.closest('.panel');
if (sourcesPanel) {
  const heading = sourcesPanel.querySelector('h2');
  const badge = sourcesPanel.querySelector('.badge');
  if (heading) heading.textContent = 'Wahrheit, LR4-Abschluss und LR5.1-Vertrag';
  if (badge) badge.textContent = '0/1 · Bildgenerierung gesperrt';
}
const sourceLinks = document.querySelector('.artifact-links');
if (sourceLinks) sourceLinks.insertAdjacentHTML('afterbegin', '<a href="./studio/#lr5-ricco"><strong>LR5.1 Ricco-Vertrag</strong><span>7 Quellen · 10 Tests · 0/1</span></a><a href="./project/lr5-ricco-master-source-inventory.json"><strong>Ricco Quelleninventar</strong><span>5 Konflikte · SVG kein Master</span></a><a href="./project/lr5-ricco-master-contract.json"><strong>Ricco Mastervertrag</strong><span>CONTRACT_READY_REVIEW_REQUIRED</span></a><a href="https://github.com/Pagebabe/comic/issues/88"><strong>LR5.1 Issue #88</strong><span>einzig aktives Arbeitspaket</span></a><a href="./studio/#pilot-fire-test"><strong>Selected-Pilot-Fire-Test live</strong><span>9/9 Stationen · Delete + Restore</span></a><a href="./project/lr4-selected-pilot-closure.json"><strong>LR4 Closure</strong><span>PR, CI, Pages und SHA-256-Beweise</span></a>');

const footer = document.querySelector('footer');
if (footer) footer.textContent = 'Comic Factory · LR4 öffentlich geschlossen · LR5.1 Ricco-Vertrag aktiv · 0/1 · Bildgenerierung gesperrt';

if (decision.selectedCandidateId !== 'pilot-das-zimmer' || candidates.selectedCandidateId !== 'pilot-das-zimmer') throw new Error('Human pilot selection is not consistent.');
if (foundation.status !== 'public_build_verified_closed' || foundationClosure.status !== 'closed_verified') throw new Error('LR2 Foundation closure is not consistent.');
if (loopClosure.status !== 'closed_verified' || loopClosure.nextGate?.trackingIssue !== 76) throw new Error('LR3 closure is not consistent.');
if (pilotClosure.status !== 'closed_verified' || pilotClosure.implementedBy?.pullRequest !== 81 || pilotClosure.publicProof?.pagesRun !== 29152807415 || pilotClosure.nextGate?.trackingIssue !== 82) throw new Error('LR4 closure is not consistent.');
if (activeGate?.id !== 'LR5' || activeGate?.trackingIssue !== 82) throw new Error('LR5 is not the single active gate.');
if (activeWorkPackage?.id !== 'LR5.1' || activeWorkPackage?.trackingIssue !== 88 || activeWorkPackage?.candidateSheets !== 0 || activeWorkPackage?.imageGenerationAllowedNow !== false || activeWorkPackage?.masterApproved !== false) throw new Error('LR5.1 is not the single active work package.');
if (riccoInventory.sources?.length !== 7 || riccoInventory.resolvedConflicts?.length !== 5 || riccoInventory.candidateBoundary?.currentCandidateSheets !== 0) throw new Error('Ricco source inventory is inconsistent.');
if (riccoContract.status !== 'CONTRACT_READY_REVIEW_REQUIRED' || riccoContract.currentState?.candidateSheets !== 0 || riccoContract.executionGate?.imageGenerationAllowedNow !== false || riccoContract.currentState?.masterApproved !== false) throw new Error('Ricco master contract is inconsistent.');
