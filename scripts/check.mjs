import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const required = [
  'README.md','index.html','app.js','audit-ui.js','styles.css','m1.css','audit.css','package.json',
  'api/bot.mjs','api/health.mjs','lib/context.mjs','lib/browser-director.mjs',
  'project/project.json','project/truth-state.json','project/canon-candidates.json','project/canon.json','project/evidence-closure.json',
  'project/character-library.json','project/character-production-sheets.json','project/lora-training-sheets.json',
  'docs/TRUTH_AUDIT_2026-07-11.md','docs/PRODUCTION_APP_RECOVERY_PLAN.md',
  'scripts/recover_assets.py','scripts/render_m1.py','.github/workflows/ci.yml','.github/workflows/pages.yml'
];
for (const file of required) await access(new URL(file, root));
const [project, truth, candidates, canon, closure, characters, sheets, loras] = await Promise.all([
  'project/project.json','project/truth-state.json','project/canon-candidates.json','project/canon.json','project/evidence-closure.json','project/character-library.json','project/character-production-sheets.json','project/lora-training-sheets.json'
].map(readJson));
if (truth.repository !== 'Pagebabe/comic' || truth.status !== 'line_reset_active' || truth.authority !== 'current_project_truth') throw new Error('Truth state is not authoritative.');
if (truth.evidence.currentCoveragePercent !== null || truth.evidence.percentageClaimAllowed !== false) throw new Error('Current evidence must not expose a percentage.');
if (truth.canon.status !== 'decision_required' || truth.canon.selectedPilot !== null) throw new Error('Pilot canon must remain undecided.');
if (truth.productArchitecture.currentMain.type !== 'audit_dashboard_shell') throw new Error('Current main architecture must be disclosed as an audit shell.');
if (truth.productArchitecture.productionFoundation.branch !== 'archive/legacy-comic-2026-07-10') throw new Error('Archive rescue source drifted.');
if (candidates.selectedCandidateId !== null || candidates.candidates?.length !== 2) throw new Error('Exactly two unselected pilot candidates are required.');
if (candidates.candidates.some((item) => item.status !== 'candidate_not_selected')) throw new Error('A pilot candidate was selected without human approval.');
if (canon.authorityStatus !== 'candidate_only_not_user_confirmed' || canon.selectedPilot !== null) throw new Error('Old canon file still overclaims authority.');
if (closure.status !== 'historical_bounded_snapshot' || closure.currentCompletenessClaimAllowed !== false || closure.snapshotThroughPullRequest !== 30) throw new Error('Historical closure is not bounded correctly.');
if (closure.classifications?.['CLAIM-016-complete-historical-pr-backfill'] !== 'disproven') throw new Error('Old complete-history claim must remain disproven.');
if (project.lineStatus !== 'line_reset_active' || project.activeMilestone !== 'LR0' || project.canonAuthority !== 'decision_required') throw new Error('Project state is not on LR0.');
if (project.inventory.visualCharacterMastersLocked !== 0 || project.inventory.approvedVoiceSamples !== 0 || project.inventory.finishedEpisodes !== 0) throw new Error('Unbuilt production assets were claimed.');
if (characters.length !== 13 || sheets.length !== 9 || loras.length !== 6) throw new Error('Preserved library counts drifted.');
for (const file of ['app.js','audit-ui.js','api/bot.mjs','api/health.mjs','lib/context.mjs','lib/browser-director.mjs','scripts/check.mjs','scripts/check_evidence_chain.mjs','scripts/build_visual_proof.mjs']) {
  const result=spawnSync(process.execPath,['--check',new URL(file,root).pathname],{encoding:'utf8'}); if(result.status!==0) throw new Error(`Syntax check failed for ${file}: ${result.stderr}`);
}
for (const file of ['scripts/recover_assets.py','scripts/render_m1.py']) { const result=spawnSync('python3',['-m','py_compile',new URL(file,root).pathname],{encoding:'utf8'}); if(result.status!==0) throw new Error(`Python syntax failed for ${file}: ${result.stderr}`); }
const [readme,index,app,audit,context,recoveryPlan,truthAudit] = await Promise.all(['README.md','index.html','app.js','audit-ui.js','lib/context.mjs','docs/PRODUCTION_APP_RECOVERY_PLAN.md','docs/TRUTH_AUDIT_2026-07-11.md'].map((path)=>readFile(new URL(path,root),'utf8')));
for (const marker of ['Produktarchitektur:       RECOVERY','Pilot-Canon:              DECISION_REQUIRED','keine Prozentzahl']) if(!readme.includes(marker)) throw new Error(`README truth marker missing: ${marker}`);
for (const marker of ['Produktionslinie retten','Canon bewusst offen','Historischer Snapshot, nicht aktuelle Vollständigkeit','id="m1Video"']) if(!index.includes(marker)) throw new Error(`Dashboard marker missing: ${marker}`);
for (const marker of ["new URL('./project/truth-state.json'","new URL('./project/canon-candidates.json'","['EVIDENCE', 'PARTIELL'",'DECISION_REQUIRED']) if(!app.includes(marker)) throw new Error(`App truth marker missing: ${marker}`);
for (const marker of ['AKTUELLE AUTORITÄT','HISTORISCHER SNAPSHOT','100%-Closure-Manifest','Alle fünf Vorfälle des alten Snapshots']) if(!audit.includes(marker)) throw new Error(`Audit UI marker missing: ${marker}`);
for (const forbidden of ['BEWEISKETTE 100% GESCHLOSSEN','Text-Canon 4/4 gesperrt','Story und 4/4 Text-Character-Bibles bleiben unverändert']) if(index.includes(forbidden)||app.includes(forbidden)||context.includes(forbidden)) throw new Error(`Current truth still contains forbidden claim: ${forbidden}`);
if (!recoveryPlan.includes('ohne den Archivbranch blind auf `main` zu kippen') || !/Ricco Studio[\s\S]*Restore/.test(recoveryPlan)) throw new Error('Recovery plan lacks atomic rescue rules.');
if (!truthAudit.includes('3979c65c4cc15f4ed4b7c72c92f559ace1c747ac') || !truthAudit.includes('Zurückgezogene Aussagen')) throw new Error('Truth audit lacks the critical product-loss finding.');
const renderScript=await readFile(new URL('scripts/render_m1.py',root),'utf8'); for(const marker of ['ffmpeg','ffprobe','technical-proof-only']) if(!renderScript.includes(marker)) throw new Error(`M1 renderer marker missing: ${marker}`);
const scanner=await readFile(new URL('scripts/recover_assets.py',root),'utf8'); for(const marker of ['readOnlySourceScan','sha256','followlinks=False','_recovery_reports']) if(!scanner.includes(marker)) throw new Error(`Recovery scanner marker missing: ${marker}`);
console.log(JSON.stringify({status:'pass',repository:truth.repository,lineStatus:truth.status,canonStatus:truth.canon.status,currentEvidenceCoveragePercent:null,productionAppStatus:truth.productArchitecture.productionFoundation.status}));
