await import('./app.js');

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const [truthResponse, closureResponse, policyRulesResponse, historyResponse, decisionResponse] = await Promise.all([
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/evidence-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/evidence-policy-rules.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/historical-pr-evidence.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/pilot-decision-record.json', import.meta.url), { cache: 'no-store' })
]);
if (![truthResponse, closureResponse, policyRulesResponse, historyResponse, decisionResponse].every((response) => response.ok)) {
  throw new Error('Truth and evidence files could not be loaded.');
}
const truth = await truthResponse.json();
const closure = await closureResponse.json();
const policyRules = await policyRulesResponse.json();
const history = await historyResponse.json();
const decision = await decisionResponse.json();

if (decision.status !== 'human_decision_recorded' || decision.selectedCandidateId !== 'pilot-das-zimmer') {
  throw new Error('Pilot decision record is missing or inconsistent.');
}

const evidenceTarget = document.querySelector('#evidenceChain');
if (evidenceTarget) {
  const priorityRule = policyRules.workRules?.find((rule) => rule.id === 'RULE-009-evidence-first-pr-gate');
  evidenceTarget.innerHTML = `
    <div class="evidence-summary">
      <article class="evidence-stat reclassified"><strong>PARTIELL</strong><span>aktuelle Evidence</span></article>
      <article class="evidence-stat proven"><strong>AUSGEWÄHLT</strong><span>Pilot · Das Zimmer</span></article>
      <article class="evidence-stat reclassified"><strong>ARCHIV</strong><span>Produktionsapp</span></article>
      <article class="evidence-stat proven"><strong>0</strong><span>Finalfolgen</span></article>
    </div>
    <article class="evidence-rule">
      <span>RECOVERY LINE · AKTUELLE AUTORITÄT · PROJECT TRUTH</span>
      <strong>Pilot menschlich ausgewählt · Detail- und Asset-Freigaben bleiben getrennt</strong>
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
        <article><span class="claim-status unproven">recovery</span><div><strong>Produktionsapp</strong><p>Die stärkere Vite-/React-Linie liegt im Archiv. LR2 führt zunächst nur die neutrale Studio-Foundation atomar zurück.</p></div></article>
        <article><span class="claim-status unproven">not_yet_built</span><div><strong>Produktionsassets</strong><p>Character-Master 0/4, Set-Master 0/4, Stimmen 0/3, fertige Episode nein.</p></div></article>
      </div>
    </details>
    <div class="evidence-links"><a href="./project/truth-state.json">Aktueller Truth State</a><a href="./project/pilot-decision-record.json">Pilot Decision Record</a><a href="./docs/PILOT_DECISION_RECORD_2026-07-11.md">Pilot-Entscheidungsprotokoll</a><a href="./project/canon-candidates.json">Canon-Kandidaten</a><a href="./docs/TRUTH_AUDIT_2026-07-11.md">Wahrheits-Audit</a><a href="./docs/PRODUCTION_APP_RECOVERY_PLAN.md">Rettungsplan</a><a href="./project/evidence-closure.json">Historisches 100%-Closure-Manifest</a><a href="./project/historical-pr-evidence.json">Historischer PR-Backfill</a><a href="./proof/runtime-evidence.json">Runtime-Beweis</a></div>`;
}
