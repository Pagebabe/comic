await import('./app.js');

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const [truthResponse, closureResponse, policyRulesResponse, historyResponse, decisionResponse, foundationClosureResponse] = await Promise.all([
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/evidence-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/evidence-policy-rules.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/historical-pr-evidence.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/pilot-decision-record.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/studio-foundation-closure.json', import.meta.url), { cache: 'no-store' })
]);
if (![truthResponse, closureResponse, policyRulesResponse, historyResponse, decisionResponse, foundationClosureResponse].every((response) => response.ok)) {
  throw new Error('Truth and evidence files could not be loaded.');
}
const truth = await truthResponse.json();
const closure = await closureResponse.json();
const policyRules = await policyRulesResponse.json();
const history = await historyResponse.json();
const decision = await decisionResponse.json();
const foundationClosure = await foundationClosureResponse.json();

if (decision.status !== 'human_decision_recorded' || decision.selectedCandidateId !== 'pilot-das-zimmer') {
  throw new Error('Pilot decision record is missing or inconsistent.');
}
if (foundationClosure.status !== 'closed_verified' || foundationClosure.nextGate?.trackingIssue !== 60) {
  throw new Error('LR2 closure or LR3 handoff is missing or inconsistent.');
}

const evidenceTarget = document.querySelector('#evidenceChain');
if (evidenceTarget) {
  const priorityRule = policyRules.workRules?.find((rule) => rule.id === 'RULE-009-evidence-first-pr-gate');
  evidenceTarget.innerHTML = `
    <div class="evidence-summary">
      <article class="evidence-stat reclassified"><strong>PARTIELL</strong><span>aktuelle Evidence · keine Prozentzahl</span></article>
      <article class="evidence-stat proven"><strong>AUSGEWÄHLT</strong><span>Pilot · Das Zimmer</span></article>
      <article class="evidence-stat proven"><strong>LR2 PASS</strong><span>Studio Foundation</span></article>
      <article class="evidence-stat proven"><strong>0</strong><span>Finalfolgen</span></article>
    </div>
    <article class="evidence-rule">
      <span>RECOVERY LINE · AKTUELLE AUTORITÄT · PROJECT TRUTH</span>
      <strong>Evidence bleibt partiell · keine Prozentzahl · keine automatische Finalfreigabe</strong>
      <p>${escapeHtml(truth.summary)} Die aktuelle Wahrheit liegt in <code>project/truth-state.json</code>.</p>
    </article>
    <article class="evidence-rule">
      <span>PRIORITY 0 · EVIDENCE FIRST</span>
      <strong>Behauptung → unabhängige Quelle → Test → Artefakt → Laufbeweis → sichtbare Prüfung → Status</strong>
      <p>${escapeHtml(priorityRule?.title || 'Evidence First bleibt aktiv.')} Ein fehlendes Glied bleibt offen. Es wird nicht durch eine Prozentzahl ersetzt.</p>
    </article>
    <article class="evidence-rule historical-snapshot">
      <span>HISTORISCHER SNAPSHOT · NICHT AKTUELLE VOLLSTÄNDIGKEIT</span>
      <strong>Historischer PR-Backfill: ${history.scope.pullRequestsAudited} ausgewählte Pull Requests · ${history.scope.historicalUnitsAudited} Einheiten</strong>
      <p>Der alte 100%-Closure-Manifest-Wert von ${closure.coverage.terminallyClassified}/${closure.coverage.trackedEntries} beschreibt nur den damaligen festen Snapshot bis PR #30. Spätere Entwicklung macht ihn ungeeignet als aktuelle Vollständigkeitsbehauptung.</p>
    </article>
    <article class="evidence-incident">
      <span>HISTORISCHE KORREKTURFÄLLE</span>
      <strong>Alle fünf Vorfälle des alten Snapshots terminal geschlossen</strong>
      <p>Diese Incident-Schließungen bleiben als historische Belege erhalten. Sie beweisen nicht die Vollständigkeit der späteren Repository-Geschichte.</p>
      <em>historical_bounded_snapshot</em>
    </article>
    <details class="evidence-open" open>
      <summary>Aktuelle offene Detailentscheidungen und Produktionslücken</summary>
      <div>
        <article><span class="claim-status proven">human_selected</span><div><strong>Pilot · Das Zimmer</strong><p>Die Pilotlinie ist ausdrücklich ausgewählt. Dialogdetails, Character-Bibles, Visuals, Stimmen und Finaltiming behalten eigene Review-Gates.</p></div></article>
        <article><span class="claim-status proven">lr2_closed</span><div><strong>Studio Foundation</strong><p>LR2 ist durch PR #59, CI, Pages und Desktop-/Mobil-Hashprüfung öffentlich geschlossen.</p></div></article>
        <article><span class="claim-status unproven">lr3_active</span><div><strong>Produktionsloop · Issue #60</strong><p>Control, Prompt Queue, Import, Review, QA, Lettering, Package und Restore sind noch nicht als ein Delete-and-Restore-Loop bewiesen.</p></div></article>
        <article><span class="claim-status unproven">not_yet_built</span><div><strong>Produktionsassets</strong><p>Character-Master 0/4, Set-Master 0/4, Stimmen 0/3, fertige Episode nein.</p></div></article>
      </div>
    </details>
    <div class="evidence-links"><a href="./project/truth-state.json">Aktueller Truth State</a><a href="./project/pilot-decision-record.json">Pilot Decision Record</a><a href="./project/studio-foundation-closure.json">LR2 Foundation Closure</a><a href="./studio/">Studio Foundation live</a><a href="https://github.com/Pagebabe/comic/issues/60">LR3 Issue #60</a><a href="./project/evidence-closure.json">Historisches 100%-Closure-Manifest</a><a href="./project/historical-pr-evidence.json">Historischer PR-Backfill</a><a href="./proof/runtime-evidence.json">Runtime-Beweis</a></div>`;
}
