await import('./app.js');

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const [truthResponse, closureResponse, policyRulesResponse, historyResponse] = await Promise.all([
  fetch(new URL('./project/truth-state.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/evidence-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/evidence-policy-rules.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/historical-pr-evidence.json', import.meta.url), { cache: 'no-store' })
]);
if (![truthResponse, closureResponse, policyRulesResponse, historyResponse].every((response) => response.ok)) {
  throw new Error('Truth and evidence files could not be loaded.');
}
const truth = await truthResponse.json();
const closure = await closureResponse.json();
const policyRules = await policyRulesResponse.json();
const history = await historyResponse.json();

const evidenceTarget = document.querySelector('#evidenceChain');
if (evidenceTarget) {
  const priorityRule = policyRules.workRules?.find((rule) => rule.id === 'RULE-009-evidence-first-pr-gate');
  evidenceTarget.innerHTML = `
    <div class="evidence-summary">
      <article class="evidence-stat reclassified"><strong>PARTIELL</strong><span>aktuelle Evidence</span></article>
      <article class="evidence-stat unproven"><strong>OFFEN</strong><span>Pilot-Canon</span></article>
      <article class="evidence-stat reclassified"><strong>ARCHIV</strong><span>Produktionsapp</span></article>
      <article class="evidence-stat proven"><strong>0</strong><span>Finalfolgen</span></article>
    </div>
    <article class="evidence-rule">
      <span>LINE RESET · AKTUELLE AUTORITÄT · PROJECT TRUTH</span>
      <strong>Keine aktuelle Prozentzahl und keine automatische Canon-Freigabe</strong>
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
      <summary>Aktuelle offene Entscheidungen und Produktionslücken</summary>
      <div>
        <article><span class="claim-status unproven">decision_required</span><div><strong>Pilot-Canon</strong><p>Das Zimmer und Der Solidarpreis sind Kandidaten. Keine Auswahl ist autorisiert.</p></div></article>
        <article><span class="claim-status unproven">recovery</span><div><strong>Produktionsapp</strong><p>Die stärkere Vite-/React-Linie liegt im Archiv und wird atomar zurückgeführt.</p></div></article>
        <article><span class="claim-status unproven">not_yet_built</span><div><strong>Produktionsassets</strong><p>Character-Master 0/4, Set-Master 0/4, Stimmen 0/3, fertige Episode nein.</p></div></article>
      </div>
    </details>
    <div class="evidence-links"><a href="./project/truth-state.json">Aktueller Truth State</a><a href="./project/canon-candidates.json">Canon-Kandidaten</a><a href="./docs/TRUTH_AUDIT_2026-07-11.md">Wahrheits-Audit</a><a href="./docs/PRODUCTION_APP_RECOVERY_PLAN.md">Rettungsplan</a><a href="./project/evidence-closure.json">Historisches 100%-Closure-Manifest</a><a href="./project/historical-pr-evidence.json">Historischer PR-Backfill</a><a href="./proof/runtime-evidence.json">Runtime-Beweis</a></div>`;
}
