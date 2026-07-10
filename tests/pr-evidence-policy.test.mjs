import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePullRequestBody } from '../scripts/check_pr_evidence.mjs';

const validBody = `
## Behauptung

Der Pull Request erzwingt ein vollständiges Evidence Packet vor jedem Merge.

## Quelle

docs/EVIDENCE_FIRST_POLICY.md und RULE-009-evidence-first-pr-gate.

## Test

node --test tests/pr-evidence-policy.test.mjs sowie der echte PR-Body-Check in Comic Factory CI.

## Artefakt

.github/pull_request_template.md, scripts/check_pr_evidence.mjs und project/evidence-policy-rules.json.

## Deployment oder Laufbeweis

Comic Factory CI führt den Prüfer im Pull-Request-Workflow aus; GitHub Pages veröffentlicht danach die aktualisierte 24/24-Kette.

## Sichtprüfung

Nach dem Pages-Deploy werden Closure-Manifest, Runtime-Beweis und Dashboardstatus sichtbar gegengeprüft.

## Aktueller Status

PENDING_DEPLOY

## Nicht behauptet

Keine Character-Master, Stimmen, Animatic-Bilder oder fertige Episode werden durch diese Policy freigegeben.

## Repository-Scope

Pagebabe/comic

## Pflichtbestätigungen

- [x] Scope auf \`Pagebabe/comic\` begrenzt
- [x] Canon und autorisierende Quelle geprüft
- [x] Regressionstest oder begründete Nichtanwendbarkeit dokumentiert
- [x] Keine unbelegte Visual-, Voice-, Canon- oder Finalfreigabe
- [x] Nicht behauptete Ergebnisse ausdrücklich benannt
- [x] Sichtprüfung oder verbindlicher Prüfplan vorhanden
`;

test('accepts a complete evidence packet', () => {
  const result = validatePullRequestBody(validBody);
  assert.equal(result.status, 'pass');
  assert.equal(result.currentStatus, 'PENDING_DEPLOY');
  assert.equal(result.repository, 'Pagebabe/comic');
});

test('rejects a missing evidence section', () => {
  assert.throws(
    () => validatePullRequestBody(validBody.replace(/## Quelle[\s\S]*?(?=## Test)/, '')),
    /Missing section: Quelle/
  );
});

test('rejects unchecked confirmations', () => {
  assert.throws(
    () => validatePullRequestBody(validBody.replace('- [x] Canon und autorisierende Quelle geprüft', '- [ ] Canon und autorisierende Quelle geprüft')),
    /Unchecked or missing confirmation/
  );
});

test('rejects unchanged template boilerplate', () => {
  assert.throws(
    () => validatePullRequestBody(validBody.replace('Der Pull Request erzwingt ein vollständiges Evidence Packet vor jedem Merge.', 'Beschreibe exakt, was dieser Pull Request nachweislich ändert oder ermöglicht.')),
    /Template boilerplate was not replaced/
  );
});

test('rejects the wrong repository scope', () => {
  assert.throws(
    () => validatePullRequestBody(validBody.replace('Pagebabe/comic\n\n## Pflichtbestätigungen', 'anderes/repository\n\n## Pflichtbestätigungen')),
    /Repository-Scope must explicitly name Pagebabe\/comic/
  );
});
