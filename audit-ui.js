await import('./app.js');

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const [evidenceResponse, visualPrepResponse] = await Promise.all([
  fetch(new URL('./project/evidence-chain.json', import.meta.url), { cache: 'no-store' }),
  fetch(new URL('./project/visual-preproduction.json', import.meta.url), { cache: 'no-store' })
]);
if (!evidenceResponse.ok || !visualPrepResponse.ok) throw new Error('Evidence audit files could not be loaded.');
const evidence = await evidenceResponse.json();
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

  const existing = card.querySelector('.identity-audit');
  if (existing) existing.remove();
  const audit = document.createElement('div');
  audit.className = 'identity-audit';
  audit.innerHTML = `
    <div><b>Pflichtanker</b><ul>${brief.requiredIdentifiers.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
    <div><b>Verboten</b><p>${brief.forbidden.slice(0, 4).map(escapeHtml).join(' · ')}</p></div>`;
  card.querySelector('.character-copy')?.append(audit);
}

const characterSummary = document.querySelector('.character-summary p');
if (characterSummary) {
  characterSummary.textContent = 'Identität, Funktion, Sprache und Visual-Briefs sind gesperrt. Da 0/4 Masterreferenzen existieren, zeigt dieses Board bewusst keine erfundenen Figurenbilder.';
}

const evidenceTarget = document.querySelector('#evidenceChain');
if (evidenceTarget) {
  const statusCounts = evidence.claims.reduce((counts, claim) => {
    counts[claim.status] = (counts[claim.status] || 0) + 1;
    return counts;
  }, {});
  const currentIncident = evidence.incidents.find((incident) => incident.id === 'INC-001-unapproved-character-portraits');
  const openClaims = evidence.claims.filter((claim) => claim.status !== 'proven');
  evidenceTarget.innerHTML = `
    <div class="evidence-summary">
      <article class="evidence-stat proven"><strong>${statusCounts.proven || 0}</strong><span>bewiesen</span></article>
      <article class="evidence-stat partial"><strong>${statusCounts.partially_proven || 0}</strong><span>teilbewiesen</span></article>
      <article class="evidence-stat reclassified"><strong>${statusCounts.reclassified || 0}</strong><span>reklassifiziert</span></article>
      <article class="evidence-stat unproven"><strong>${statusCounts.unproven || 0}</strong><span>unbewiesen</span></article>
    </div>
    <article class="evidence-rule">
      <span>VERBINDLICHE KETTE</span>
      <strong>Behauptung → Quelle → Test → Artefakt → Deploy → Sichtprüfung → Status</strong>
      <p>Ein fehlendes Glied blockiert den Status PROVEN. Die schwächste Stelle bestimmt die Wahrheit.</p>
    </article>
    <article class="evidence-incident">
      <span>AKTIVER KORREKTURFALL</span>
      <strong>${escapeHtml(currentIncident?.id || 'INC-001')} · Unfreigegebene Character-Porträts</strong>
      <p>${escapeHtml(currentIncident?.problem || '')}</p>
      <em>${escapeHtml(currentIncident?.status || 'corrective_action_active')}</em>
    </article>
    <details class="evidence-open">
      <summary>${openClaims.length} offene, teilweise oder verworfene Behauptungen anzeigen</summary>
      <div>${openClaims.map((claim) => `<article><span class="claim-status ${escapeHtml(claim.status)}">${escapeHtml(claim.status)}</span><div><strong>${escapeHtml(claim.title)}</strong><p>${escapeHtml(claim.gaps?.[0] || claim.visibleCheck?.detail || '')}</p></div></article>`).join('')}</div>
    </details>
    <div class="evidence-links"><a href="./project/evidence-chain.json">Maschinenlesbare Beweiskette</a><a href="./docs/RETROACTIVE_EVIDENCE_AUDIT.md">Vollständiger Audit</a></div>`;
}
