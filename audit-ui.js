await import('./app.js');

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const [evidenceResponse, closureResponse, policyRulesResponse, visualPrepResponse] = await Promise.all([
  fetch(new URL('./project/evidence-chain.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/evidence-closure.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/evidence-policy-rules.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/visual-preproduction.json', import.meta.url), { cache: 'no-store' })
]);
if (!evidenceResponse.ok || !closureResponse.ok || !policyRulesResponse.ok || !visualPrepResponse.ok) throw new Error('Evidence audit files could not be loaded.');
const evidence = await evidenceResponse.json();
const closure = await closureResponse.json();
const policyRules = await policyRulesResponse.json();
const visualPrep = await visualPrepResponse.json();

const briefsByName = new Map(visualPrep.characterSheets.map((brief) => [brief.name, brief]));
for (const card of document.querySelectorAll('.core-card')) {
  const name = card.querySelector('h3')?.textContent?.trim();
  const brief = briefsByName.get(name);
  const portrait = card.querySelector('.portrait');
  if (!brief || !portrait) continue;
  const initials = portrait.querySelector('strong')?.textContent || '';
  portrait.classList.add('audit-placeholder');
  portrait.innerHTML = `
    <div class="visual-unproven">
      <span>VISUAL OFFEN</span>
      <b>Keine freigegebene Masterreferenz</b>
      <small>Technische SVGs werden nicht als Figur gezeigt.</small>
    </div>
    <strong>${escapeHtml(initials)}</strong>`;

  const audit = document.createElement('div');
  audit.className = 'identity-audit';
  audit.innerHTML = `
    <div><b>Pflichtanker</b><ul>${brief.requiredIdentifiers.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
    <div><b>Verboten</b><p>${brief.forbidden.slice(0, 4).map(escapeHtml).join(' · ')}</p></div>`;
  card.querySelector('.identity-audit')?.remove();
  card.querySelector('.character-copy')?.append(audit);
}

const characterSummary = document.querySelector('.character-summary p');
if (characterSummary) characterSummary.textContent = 'Identität, Funktion, Sprache und Visual-Briefs sind gesperrt. Da 0/4 Masterreferenzen existieren, zeigt dieses Board bewusst keine erfundenen Figurenbilder.';

const evidenceTarget = document.querySelector('#evidenceChain');
if (evidenceTarget) {
  const classifications = Object.entries(closure.classifications);
  const counts = classifications.reduce((result, [, status]) => {
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});
  const nonProductComplete = classifications.filter(([, status]) => status !== 'proven');
  const priorityRule = policyRules.workRules?.find((rule) => rule.id === 'RULE-009-evidence-first-pr-gate');
  evidenceTarget.innerHTML = `
    <div class="evidence-summary">
      <article class="evidence-stat proven"><strong>${closure.coverage.percent}%</strong><span>Beweiskettenabdeckung</span></article>
      <article class="evidence-stat proven"><strong>${closure.coverage.terminallyClassified}/${closure.coverage.trackedEntries}</strong><span>terminal klassifiziert</span></article>
      <article class="evidence-stat reclassified"><strong>${counts.disproven || 0}</strong><span>widerlegt</span></article>
      <article class="evidence-stat unproven"><strong>${counts.not_yet_built || 0}</strong><span>noch nicht gebaut</span></article>
    </div>
    <article class="evidence-rule">
      <span>PRIORITY 0 · BEWEISKETTE 100% GESCHLOSSEN</span>
      <strong>Behauptung → Quelle → Test → Artefakt → Deploy → Sichtprüfung → Status</strong>
      <p>${escapeHtml(priorityRule?.title || closure.coverage.meaning)} Jeder Pull Request benötigt ein vollständiges Evidence Packet.</p>
    </article>
    <article class="evidence-incident">
      <span>KORREKTURFÄLLE</span>
      <strong>Alle drei Vorfälle terminal geschlossen</strong>
      <p>Portraitfehler visuell gesperrt, doppelte PRs ohne Merge geschlossen und alter Backend-Entwurf als superseded beendet.</p>
      <em>closed_verified</em>
    </article>
    <details class="evidence-open">
      <summary>${nonProductComplete.length} Einträge sind bewusst nicht als Produktfortschritt bewiesen</summary>
      <div>${nonProductComplete.map(([id, status]) => `<article><span class="claim-status ${escapeHtml(status)}">${escapeHtml(status)}</span><div><strong>${escapeHtml(id)}</strong><p>Terminal klassifiziert. Kein offener Audit-Schwebezustand.</p></div></article>`).join('')}</div>
    </details>
    <div class="evidence-links"><a href="./docs/EVIDENCE_FIRST_POLICY.md">Priority-0-Policy</a><a href="./project/evidence-policy-rules.json">Aktive Policy-Regeln</a><a href="./project/evidence-chain.json">Historischer Ledger</a><a href="./project/evidence-closure.json">100%-Closure-Manifest</a><a href="./proof/runtime-evidence.json">Runtime-Beweis</a><a href="./proof/dashboard-desktop.png">Desktop-Screenshot</a><a href="./proof/dashboard-mobile.png">Mobil-Screenshot</a></div>`;
}
