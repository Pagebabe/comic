import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const required = [
  'README.md','index.html','app.js','lr1-ui.js','audit-ui.js','styles.css','m1.css','audit.css','package.json',
  'api/bot.mjs','api/health.mjs','lib/context.mjs','lib/browser-director.mjs',
  'project/project.json','project/truth-state.json','project/line-reset-closure.json','project/canon-candidates.json','project/pilot-decision-record.json','project/canon.json','project/evidence-closure.json',
  'project/studio-foundation-inventory.json','project/studio-foundation-status.json','project/studio-foundation-closure.json',
  'project/character-library.json','project/character-production-sheets.json','project/lora-training-sheets.json',
  'docs/TRUTH_AUDIT_2026-07-11.md','docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md','docs/PILOT_DECISION_RECORD_2026-07-11.md','docs/STUDIO_FOUNDATION_RECOVERY_2026-07-11.md','docs/PRODUCTION_APP_RECOVERY_PLAN.md',
  'scripts/recover_assets.py','scripts/render_m1.py','.github/workflows/ci.yml','.github/workflows/pages.yml'
];
for (const file of required) await access(new URL(file, root));
const [project, truth, lr0Closure, decisionRecord, canon, evidenceClosure, foundationStatus, foundationClosure, characters, sheets, loras] = await Promise.all([
  'project/project.json','project/truth-state.json','project/line-reset-closure.json','project/pilot-decision-record.json','project/canon.json','project/evidence-closure.json','project/studio-foundation-status.json','project/studio-foundation-closure.json','project/character-library.json','project/character-production-sheets.json','project/lora-training-sheets.json'
].map(readJson));
if (truth.repository !== 'Pagebabe/comic' || truth.status !== 'recovery_line_active' || truth.authority !== 'current_project_truth') throw new Error('Truth state is not authoritative.');
if (truth.trackingIssue !== 60 || truth.nextSequence?.find((item) => item.id === 'LR2')?.status !== 'done' || truth.nextSequence?.find((item) => item.id === 'LR3')?.status !== 'active_recovery_gate') throw new Error('LR2 closure or LR3 activation drifted.');
if (truth.nextSequence?.find((item) => item.id === 'LR3')?.trackingIssue !== 60) throw new Error('LR3 tracking issue drifted.');
if (truth.evidence.currentCoveragePercent !== null || truth.evidence.percentageClaimAllowed !== false) throw new Error('Current evidence must not expose a percentage.');
if (truth.canon.status !== 'pilot_selected_human_confirmed' || truth.canon.selectedPilot !== 'pilot-das-zimmer' || truth.canon.selectedTitle !== 'Das Zimmer') throw new Error('Human pilot selection is missing.');
if (truth.productArchitecture.currentMain.type !== 'audit_dashboard_with_verified_studio_foundation') throw new Error('Current architecture does not disclose the verified Foundation.');
if (truth.productArchitecture.productionFoundation.status !== 'neutral_foundation_publicly_verified_production_loop_pending') throw new Error('Production Foundation boundary drifted.');
if (lr0Closure.status !== 'closed_verified' || lr0Closure.pullRequest !== 37 || lr0Closure.mergeCommit !== '47b513c31d5326efdf5bd8c81e835233f97b6b47') throw new Error('LR0 closure proof drifted.');
if (decisionRecord.status !== 'human_decision_recorded' || decisionRecord.selectedCandidateId !== 'pilot-das-zimmer' || decisionRecord.sourceRecord?.userConfirmation !== 'ok') throw new Error('Human pilot decision record is invalid.');
if (canon.authorityStatus !== 'pilot_selected_human_confirmed_detail_reviews_open' || canon.selectedPilot !== 'pilot-das-zimmer') throw new Error('Canon file does not preserve the narrow pilot selection.');
if (foundationStatus.status !== 'public_build_verified_closed' || foundationStatus.productionReady !== false || foundationStatus.productionLoopRestored !== false || foundationStatus.nextGate?.trackingIssue !== 60) throw new Error('Foundation status is not closed with an open production loop.');
if (foundationClosure.status !== 'closed_verified' || foundationClosure.pullRequest?.number !== 59 || foundationClosure.pullRequest?.ciRun !== 29148650720 || foundationClosure.pullRequest?.mergeCommit !== '18d0c34b81db781305941c0e9f34c308ac5c8b76' || foundationClosure.deployment?.runId !== 29148728164 || foundationClosure.deployment?.publicVerificationPassed !== true) throw new Error('LR2 closure proof drifted.');
if (foundationClosure.visibleCountercheck.desktop.horizontalOverflowPixels !== 0 || foundationClosure.visibleCountercheck.mobile.horizontalOverflowPixels !== 0 || foundationClosure.nextGate?.trackingIssue !== 60) throw new Error('LR2 visible proof or LR3 handoff drifted.');
if (evidenceClosure.status !== 'historical_bounded_snapshot' || evidenceClosure.currentCompletenessClaimAllowed !== false || evidenceClosure.snapshotThroughPullRequest !== 30) throw new Error('Historical closure is not bounded correctly.');
if (project.lineStatus !== 'recovery_line_active' || project.activeMilestone !== 'LR3' || project.activeTrackingIssue !== 60 || project.selectedPilot !== 'pilot-das-zimmer') throw new Error('Project state is not on LR3.');
if (project.inventory.visualCharacterMastersLocked !== 0 || project.inventory.approvedVoiceSamples !== 0 || project.inventory.finishedEpisodes !== 0 || project.inventory.productionLoopRestored !== false) throw new Error('Unbuilt production work was claimed.');
if (characters.length !== 13 || sheets.length !== 9 || loras.length !== 6) throw new Error('Preserved library counts drifted.');
for (const file of ['app.js','lr1-ui.js','audit-ui.js','api/bot.mjs','api/health.mjs','lib/context.mjs','lib/browser-director.mjs','scripts/check.mjs','scripts/check_evidence_chain.mjs','scripts/check_studio_foundation.mjs','scripts/build_visual_proof.mjs']) {
  const result=spawnSync(process.execPath,['--check',new URL(file,root).pathname],{encoding:'utf8'}); if(result.status!==0) throw new Error(`Syntax check failed for ${file}: ${result.stderr}`);
}
for (const file of ['scripts/recover_assets.py','scripts/render_m1.py']) { const result=spawnSync('python3',['-m','py_compile',new URL(file,root).pathname],{encoding:'utf8'}); if(result.status!==0) throw new Error(`Python syntax failed for ${file}: ${result.stderr}`); }
const [readme,phaseUi,audit,context,recoveryPlan] = await Promise.all(['README.md','lr1-ui.js','audit-ui.js','lib/context.mjs','docs/PRODUCTION_APP_RECOVERY_PLAN.md'].map((path)=>readFile(new URL(path,root),'utf8')));
for (const marker of ['LR2 Studio Foundation:    geschlossen','aktives Gate:             LR3 PRODUKTIONSLOOP','Issue #60','keine Prozentzahl']) if(!readme.includes(marker)) throw new Error(`README marker missing: ${marker}`);
for (const marker of ['LR3 PRODUKTIONSLOOP','LR2 FOUNDATION','Issue #60','studio-foundation-closure.json']) if(!phaseUi.includes(marker)) throw new Error(`Dashboard marker missing: ${marker}`);
for (const marker of ['AKTUELLE AUTORITÄT','HISTORISCHER SNAPSHOT']) if(!audit.includes(marker)) throw new Error(`Audit marker missing: ${marker}`);
for (const marker of ['aktives Gate: LR3 minimalen Produktionsloop retten','Issue #60','Pages 29148728164']) if(!context.includes(marker)) throw new Error(`Director marker missing: ${marker}`);
for (const forbidden of ['BEWEISKETTE 100% GESCHLOSSEN','kein Kandidat ist ausgewählt','aktives Gate: LR2 Studio Foundation retten']) if(phaseUi.includes(forbidden)||context.includes(forbidden)||readme.includes(forbidden)) throw new Error(`Current truth still contains forbidden claim: ${forbidden}`);
if (!/Control[\s\S]*Studio[\s\S]*Prompt Queue[\s\S]*Restore/.test(recoveryPlan)) throw new Error('Recovery plan lacks the production loop sequence.');
console.log(JSON.stringify({status:'pass',repository:truth.repository,lineStatus:truth.status,closedGate:'LR2',activeGate:'LR3',trackingIssue:60,selectedPilot:'pilot-das-zimmer',currentEvidenceCoveragePercent:null,productionLoopRestored:false}));
