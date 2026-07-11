// Wait for the base dashboard before projecting the current recovery-line truth onto its DOM.
await import('./app.js');

const [truthResponse, candidateResponse, decisionResponse, foundationResponse, foundationClosureResponse, loopClosureResponse, pilotClosureResponse] = await Promise.all([
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/canon-candidates.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/pilot-decision-record.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/studio-foundation-status.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/studio-foundation-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lr3-production-loop-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/lr4-selected-pilot-closure.json', import.meta.url), { cache: 'no-store' })
]);

if (![truthResponse, candidateResponse, decisionResponse, foundationResponse, foundationClosureResponse, loopClosureResponse, pilotClosureResponse].every((response) => response.ok)) throw new Error('Recovery-line truth files could not be loaded.');
const truth = await truthResponse.json();
const candidates = await candidateResponse.json();
const decision = await decisionResponse.json();
const foundation = await foundationResponse.json();
const foundationClosure = await foundationClosureResponse.json();
const loopClosure = await loopClosureResponse.json();
const pilotClosure = await pilotClosureResponse.json();

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const activeGate = truth.nextSequence.find((item) => item.status.startsWith('active'));

const topEyebrow = document.querySelector('.hero-copy .eyebrow');
if (topEyebrow) topEyebrow.textContent = 'COMIC FACTORY · LR5 VISUAL-, SET- UND VOICE-LOCKS';
const topTitle = document.querySelector('.hero-copy h1');
if (topTitle) topTitle.innerHTML = 'Das Zimmer transportiert.<br>Jetzt echte Master einzeln beweisen.';
const topText = document.querySelector('.hero-copy p');
if (topText) topText.textContent = 'LR0 bis LR4 sind geschlossen. Der ausgewählte Das-Zimmer-Pfad bestand neun Stationen, echte Zustandslöschung und hashgleichen Restore. Jetzt beginnt LR5 kontrolliert mit einem source-bound Ricco-Master-Kandidaten statt einem unübersichtlichen Bilderstapel.';

const systemStatus = document.querySelector('#systemStatus');
if (systemStatus) systemStatus.textContent = 'LR5 · Dashboard online';
const statusDetail = document.querySelector('.status-card div > span:last-child');
if (statusDetail) statusDetail.textContent = 'LR5 · Issue #82 · LR4 PROVEN';

const metrics = document.querySelector('#metrics');
if (metrics) {
  metrics.innerHTML = [
    ['LR0 TRUTH RESET', 'PASS', 'öffentlich bewiesen'],
    ['LR1 PILOTWAHL', 'PASS', 'Das Zimmer menschlich ausgewählt'],
    ['LR2 FOUNDATION', 'PASS', 'PR #59 · Pages 29148728164'],
    ['LR3 LOOP', 'PASS', '9/9 · Delete + Restore · Pages 29150875221'],
    ['LR4 PILOT FIRE TEST', 'PASS', 'PR #81 · Pages 29152807415'],
    ['AKTIVES GATE', 'LR5', 'Issue #82 · Visual-, Set- und Voice-Locks'],
    ['VISUELLE MASTERS', '0/8', '0/4 Figuren · 0/4 Sets'],
    ['FERTIGE EPISODE', 'NEIN', 'kein Finalexport vorhanden']
  ].map(([label, value, note]) => `<article><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`).join('');
}

const cockpitCards = document.querySelectorAll('#productionCockpit .cockpit-card');
if (cockpitCards[0]) cockpitCards[0].innerHTML = '<span class="cockpit-kicker">AKTUELLE LINIE</span><strong>LR5 · Visual-, Set- und Voice-Locks</strong><p>Der ausgewählte Pilot ist transporttechnisch öffentlich bewiesen. Jetzt werden Character-, Set- und Voice-Kandidaten einzeln source-bound, versioniert und sichtbar geprüft.</p><div class="status-line"><span class="status-dot safe"></span><b>Erster Slice:</b> Ricco Master-Kandidat</div>';
if (cockpitCards[1]) cockpitCards[1].innerHTML = `<span class="cockpit-kicker">LR4 BEWIESEN</span><strong>9/9 Stationen · HASH MATCH</strong><p>PR #${pilotClosure.implementedBy.pullRequest}, Merge ${escapeHtml(pilotClosure.implementedBy.mergeCommit.slice(0, 12))}, Pages ${pilotClosure.publicProof.pagesRun}. Detail-, Visual- und Voice-Freigaben bleiben offen.</p><a href="./studio/#pilot-fire-test">Das-Zimmer-Fire-Test öffnen</a>`;
if (cockpitCards[2]) cockpitCards[2].innerHTML = '<span class="cockpit-kicker">KREATIVE GRENZE</span><strong>TRANSPORT PROVEN · MASTERS OPEN</strong><p>LR4 beweist Quellenbindung, Pakettransport, Löschung und Restore. Es genehmigt keine Figurenform, Palette, Location, Stimme, Dialog- oder Timingfassung.</p><a href="./project/lr4-selected-pilot-closure.json">LR4 Closure öffnen</a>';
if (cockpitCards[3]) cockpitCards[3].innerHTML = '<span class="cockpit-kicker">NÄCHSTE AUFGABEN</span><ol><li>Ricco-Prüfkriterien festlegen</li><li>Quellen und Version binden</li><li>genau einen Master-Kandidaten erzeugen</li><li>Ansichten und Ausdrücke sichtbar reviewen</li></ol>';

const botPanel = document.querySelector('.bot-panel');
if (botPanel) {
  const heading = botPanel.querySelector('.section-head h2');
  const badge = botPanel.querySelector('.section-head .badge');
  const textarea = botPanel.querySelector('#messageInput');
  const commands = botPanel.querySelector('.command-row');
  if (heading) heading.textContent = 'Master-Kandidaten einzeln prüfen, nicht heimlich finalisieren';
  if (badge) badge.textContent = 'LR5 aktiv';
  if (textarea) textarea.placeholder = 'Zum Beispiel: Welche Prüfkriterien braucht der erste Ricco-Master-Kandidat?';
  if (commands) commands.innerHTML = '<button data-prompt="/status">Wahrheitsstatus</button><button data-prompt="/next">Nächster Schritt</button><button data-prompt="/characters">Pilotcast</button><button data-prompt="/plan">Rettungsplan</button><button data-prompt="Definiere nur den Quellen- und Review-Vertrag für einen Ricco-Master-Kandidaten. Kein Massenrendern und keine automatische Freigabe.">LR5 prüfen</button>';
}

const firstBotMessage = document.querySelector('#chat .message.bot');
if (firstBotMessage) firstBotMessage.textContent = 'Comic Director bereit. LR0 bis LR4 sind geschlossen. Das Zimmer ist ausgewählt und sein technischer Fire Test ist öffentlich bewiesen. LR5 Issue #82 ist aktiv. Ich darf einzelne source-bound Master-Kandidaten vorbereiten und prüfen, aber keine automatische Character-, Set-, Voice-, Dialog-, Timing- oder Finalfreigabe erteilen.';

const characterBoard = document.querySelector('.character-board');
if (characterBoard) {
  const eyebrow = characterBoard.querySelector('.eyebrow');
  const heading = characterBoard.querySelector('h2');
  if (eyebrow) eyebrow.textContent = 'LR5 · AUSGEWÄHLTER PILOTCAST';
  if (heading) heading.textContent = 'Ricco zuerst · danach Basti, Jule und Don Miau einzeln reviewen';
}
const characterSummary = document.querySelector('.character-summary');
if (characterSummary) characterSummary.innerHTML = '<div><span class="character-state">LR4 TRANSPORTGEPRÜFT · LR5 MASTERREVIEW OFFEN</span><h3>Figurenrichtung gewählt · Masterreferenzen 0/4</h3><p>Ricco, Basti, Jule und Don Miau gehören zu „Das Zimmer“. LR5 beginnt mit genau einem Ricco-Kandidaten. Ein technischer oder visueller Kandidat ist kein Master ohne menschliche Review.</p></div><div class="summary-stats"><span><b>4</b> Kernpläne</span><span><b>13</b> Quellenfiguren</span><span class="open"><b>0/4</b> Masterreferenzen</span></div>';
for (const node of document.querySelectorAll('.core-card .character-state')) node.textContent = 'LR5 · MASTERREVIEW OFFEN';
for (const footer of document.querySelectorAll('.core-card .card-footer')) footer.innerHTML = '<span>Textplan vorhanden</span><span>Visual und Detail REVIEW_REQUIRED</span>';

const proofGridPanels = document.querySelectorAll('.proof-grid > .panel');
if (proofGridPanels[1]) {
  const eyebrow = proofGridPanels[1].querySelector('.eyebrow');
  const heading = proofGridPanels[1].querySelector('h2');
  const badge = proofGridPanels[1].querySelector('.badge');
  if (eyebrow) eyebrow.textContent = 'JETZT';
  if (heading) heading.textContent = 'Nur der erste source-bound LR5-Master-Kandidat';
  if (badge) badge.textContent = 'Kein Massenrendern · keine automatische Freigabe';
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
if (tasks) tasks.innerHTML = `<div class="task-summary"><strong>LR5 aktiv</strong><span>${truth.nextSequence.length} kontrollierte Gates</span></div>${truth.nextSequence.map((item, index) => {
  const state = item.status === 'done' ? 'done' : item.status.startsWith('active') ? 'ready' : 'blocked';
  return `<article class="task-${state}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.doneWhen)}</p></div><em>${escapeHtml(item.status)}</em></article>`;
}).join('')}`;

const gateCard = document.querySelector('.gate-card');
if (gateCard) gateCard.innerHTML = '<span class="eyebrow">NÄCHSTER HALT</span><h2>Ricco als ersten Master-Kandidaten.<br>Einzeln, versioniert, sichtbar geprüft.</h2><p>LR5 darf jetzt kontrollierte visuelle Kandidaten erzeugen. Jeder Kandidat bleibt REVIEW_REQUIRED, bis eine ausdrückliche menschliche Entscheidung ihn freigibt oder ablehnt.</p><div class="gate-list"><span>✓ Truth Reset geschlossen</span><span>✓ „Das Zimmer“ ausgewählt</span><span>✓ Studio und neutraler Loop bewiesen</span><span>✓ LR4 Das-Zimmer-Fire-Test öffentlich bewiesen</span><span>✓ LR5 Issue #82 eröffnet</span><span>□ Ricco-Prüfvertrag gebunden</span><span>□ erster Ricco-Kandidat sichtbar reviewt</span><span>□ menschliche Masterentscheidung dokumentiert</span></div>';

const sourcesPanel = document.querySelector('.artifact-links')?.closest('.panel');
if (sourcesPanel) {
  const heading = sourcesPanel.querySelector('h2');
  const badge = sourcesPanel.querySelector('.badge');
  if (heading) heading.textContent = 'Wahrheit, LR4-Abschluss und LR5-Arbeitslinie';
  if (badge) badge.textContent = 'Visual-, Set- und Voice-Locks offen';
}
const sourceLinks = document.querySelector('.artifact-links');
if (sourceLinks) sourceLinks.insertAdjacentHTML('afterbegin', '<a href="./studio/#pilot-fire-test"><strong>Selected-Pilot-Fire-Test live</strong><span>9/9 Stationen · Delete + Restore</span></a><a href="./project/lr4-selected-pilot-closure.json"><strong>LR4 Closure</strong><span>PR, CI, Pages und SHA-256-Beweise</span></a><a href="https://github.com/Pagebabe/comic/issues/82"><strong>LR5 Issue #82</strong><span>Visual-, Set- und Voice-Locks</span></a>');

const footer = document.querySelector('footer');
if (footer) footer.textContent = 'Comic Factory · LR4 öffentlich bewiesen · LR5 Visual-, Set- und Voice-Locks aktiv · keine automatische kreative Freigabe';

if (decision.selectedCandidateId !== 'pilot-das-zimmer' || candidates.selectedCandidateId !== 'pilot-das-zimmer') throw new Error('Human pilot selection is not consistent.');
if (foundation.status !== 'public_build_verified_closed' || foundationClosure.status !== 'closed_verified') throw new Error('LR2 Foundation closure is not consistent.');
if (loopClosure.status !== 'closed_verified' || loopClosure.nextGate?.trackingIssue !== 76) throw new Error('LR3 closure is not consistent.');
if (pilotClosure.status !== 'closed_verified' || pilotClosure.implementedBy?.pullRequest !== 81 || pilotClosure.publicProof?.pagesRun !== 29152807415 || pilotClosure.nextGate?.trackingIssue !== 82) throw new Error('LR4 closure is not consistent.');
if (activeGate?.id !== 'LR5' || activeGate?.trackingIssue !== 82) throw new Error('LR5 is not the single active gate.');
