import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const required = [
  'README.md','index.html','app.js','lr1-ui.js','audit-ui.js','styles.css','m1.css','audit.css','package.json',
  'api/bot.mjs','api/health.mjs','lib/context.mjs','lib/browser-director.mjs',
  'project/project.json','project/truth-state.json','project/line-reset-closure.json','project/canon-candidates.json','project/pilot-decision-packet.json','project/pilot-decision-record.json','project/canon.json','project/evidence-closure.json',
  'project/character-library.json','project/character-production-sheets.json','project/lora-training-sheets.json',
  'docs/TRUTH_AUDIT_2026-07-11.md','docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md','docs/PILOT_DECISION_PACKET_2026-07-11.md','docs/PILOT_DECISION_RECORD_2026-07-11.md','docs/PRODUCTION_APP_RECOVERY_PLAN.md',
  'scripts/recover_assets.py','scripts/render_m1.py','.github/workflows/ci.yml','.github/workflows/pages.yml'
];
for (const file of required) await access(new URL(file, root));
const [project, truth, lr0Closure, candidates, decisionPacket, decisionRecord, canon, closure, characters, sheets, loras] = await Promise.all([
  'project/project.json','project/truth-state.json','project/line-reset-closure.json','project/canon-candidates.json','project/pilot-decision-packet.json','project/pilot-decision-record.json','project/canon.json','project/evidence-closure.json','project/character-library.json','project/character-production-sheets.json','project/lora-training-sheets.json'
].map(readJson));
if (truth.repository !== 'Pagebabe/comic' || truth.status !== 'recovery_line_active' || truth.authority !== 'current_project_truth') throw new Error('Truth state is not authoritative.');
if (truth.trackingIssue !== 45 || truth.nextSequence?.find((item) => item.id === 'LR0')?.status !== 'done' || truth.nextSequence?.find((item) => item.id === 'LR1')?.status !== 'done' || truth.nextSequence?.find((item) => item.id === 'LR2')?.status !== 'active_recovery_gate') throw new Error('LR1 closure or LR2 activation drifted.');
if (truth.evidence.currentCoveragePercent !== null || truth.evidence.percentageClaimAllowed !== false) throw new Error('Current evidence must not expose a percentage.');
if (truth.canon.status !== 'pilot_selected_human_confirmed' || truth.canon.selectedPilot !== 'pilot-das-zimmer' || truth.canon.selectedTitle !== 'Das Zimmer') throw new Error('Human pilot selection is missing from current truth.');
if (truth.productArchitecture.currentMain.type !== 'audit_dashboard_shell') throw new Error('Current main architecture must be disclosed as an audit shell.');
if (truth.productArchitecture.productionFoundation.branch !== 'archive/legacy-comic-2026-07-10') throw new Error('Archive rescue source drifted.');
if (lr0Closure.status !== 'closed_verified' || lr0Closure.pullRequest !== 37 || lr0Closure.mergeCommit !== '47b513c31d5326efdf5bd8c81e835233f97b6b47' || lr0Closure.ci.runId !== 29133307545 || lr0Closure.deployment.runId !== 29143665894) throw new Error('LR0 closure proof drifted.');
if (decisionRecord.status !== 'human_decision_recorded' || decisionRecord.selectedCandidateId !== 'pilot-das-zimmer' || decisionRecord.decidedBy !== 'project_owner_user' || decisionRecord.sourceRecord?.userConfirmation !== 'ok' || decisionRecord.nextGate?.trackingIssue !== 45) throw new Error('Explicit human pilot decision record is invalid.');
if (candidates.status !== 'human_decision_recorded' || candidates.selectedCandidateId !== 'pilot-das-zimmer' || candidates.candidates?.length !== 2) throw new Error('Candidate registry does not contain the selected pilot.');
if (candidates.candidates.find((item) => item.id === 'pilot-das-zimmer')?.status !== 'selected_human_confirmed') throw new Error('Das Zimmer is not marked selected.');
if (candidates.candidates.find((item) => item.id === 'pilot-der-solidarpreis')?.status !== 'archived_not_selected') throw new Error('Der Solidarpreis is not traceably archived.');
if (decisionPacket.status !== 'human_decision_recorded' || decisionPacket.selectedCandidateId !== 'pilot-das-zimmer' || decisionPacket.humanDecision?.decisionMessage !== 'ok') throw new Error('Decision packet is not closed by the human selection.');
if (decisionPacket.advisoryRecommendation?.status !== 'accepted_by_explicit_human_decision' || decisionPacket.nextGate?.id !== 'LR2' || decisionPacket.nextGate?.trackingIssue !== 45) throw new Error('Decision packet does not hand off to LR2.');
if (canon.authorityStatus !== 'pilot_selected_human_confirmed_detail_reviews_open' || canon.selectedPilot !== 'pilot-das-zimmer') throw new Error('Canon file does not reflect the narrow pilot selection.');
if (!/does not automatically approve|not automatically approve/i.test(decisionPacket.advisoryRecommendation?.boundary || '')) throw new Error('Decision boundary does not preserve detail review gates.');
if (closure.status !== 'historical_bounded_snapshot' || closure.currentCompletenessClaimAllowed !== false || closure.snapshotThroughPullRequest !== 30) throw new Error('Historical closure is not bounded correctly.');
if (closure.classifications?.['CLAIM-016-complete-historical-pr-backfill'] !== 'disproven') throw new Error('Old complete-history claim must remain disproven.');
if (project.lineStatus !== 'recovery_line_active' || project.activeMilestone !== 'LR2' || project.activeTrackingIssue !== 45 || project.canonAuthority !== 'pilot_selected_human_confirmed' || project.selectedPilot !== 'pilot-das-zimmer') throw new Error('Project state is not on LR2.');
if (project.inventory.visualCharacterMastersLocked !== 0 || project.inventory.approvedVoiceSamples !== 0 || project.inventory.finishedEpisodes !== 0) throw new Error('Unbuilt production assets were claimed.');
if (characters.length !== 13 || sheets.length !== 9 || loras.length !== 6) throw new Error('Preserved library counts drifted.');
for (const file of ['app.js','lr1-ui.js','audit-ui.js','api/bot.mjs','api/health.mjs','lib/context.mjs','lib/browser-director.mjs','scripts/check.mjs','scripts/check_evidence_chain.mjs','scripts/build_visual_proof.mjs']) {
  const result=spawnSync(process.execPath,['--check',new URL(file,root).pathname],{encoding:'utf8'}); if(result.status!==0) throw new Error(`Syntax check failed for ${file}: ${result.stderr}`);
}
for (const file of ['scripts/recover_assets.py','scripts/render_m1.py']) { const result=spawnSync('python3',['-m','py_compile',new URL(file,root).pathname],{encoding:'utf8'}); if(result.status!==0) throw new Error(`Python syntax failed for ${file}: ${result.stderr}`); }
const [readme,phaseUi,audit,context,recoveryPlan,truthAudit,closureAudit,decisionRecordDoc] = await Promise.all(['README.md','lr1-ui.js','audit-ui.js','lib/context.mjs','docs/PRODUCTION_APP_RECOVERY_PLAN.md','docs/TRUTH_AUDIT_2026-07-11.md','docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md','docs/PILOT_DECISION_RECORD_2026-07-11.md'].map((path)=>readFile(new URL(path,root),'utf8')));
for (const marker of ['Produktarchitektur:       RECOVERY','LR1 Pilotentscheidung:    geschlossen','ausgewählter Pilot:       DAS ZIMMER','aktives Gate:             LR2 STUDIO FOUNDATION','Issue #45','keine Prozentzahl']) if(!readme.includes(marker)) throw new Error(`README truth marker missing: ${marker}`);
for (const marker of ['LR2 STUDIO FOUNDATION','Pilot DAS ZIMMER','Issue #45','pilot-decision-record.json','truth.nextSequence','startsWith(\'active\')']) if(!phaseUi.includes(marker)) throw new Error(`Recovery UI marker missing: ${marker}`);
for (const marker of ['AKTUELLE AUTORITÄT','HISTORISCHER SNAPSHOT','100%-Closure-Manifest','Alle fünf Vorfälle des alten Snapshots']) if(!audit.includes(marker)) throw new Error(`Audit UI marker missing: ${marker}`);
for (const marker of ['HUMAN_DECISION_RECORDED','Das Zimmer','genehmigt **nicht automatisch**','LR2 Studio Foundation retten']) if(!decisionRecordDoc.includes(marker)) throw new Error(`Pilot decision record marker missing: ${marker}`);
for (const marker of ['aktives Gate: LR2 Studio Foundation retten','ausgewählter Pilot: Das Zimmer','Issue #45']) if(!context.includes(marker)) throw new Error(`Director context marker missing: ${marker}`);
for (const forbidden of ['BEWEISKETTE 100% GESCHLOSSEN','Text-Canon 4/4 gesperrt','Story und 4/4 Text-Character-Bibles bleiben unverändert','kein Kandidat ist ausgewählt']) if(phaseUi.includes(forbidden)||context.includes(forbidden)||readme.includes(forbidden)) throw new Error(`Current truth still contains forbidden claim: ${forbidden}`);
if (!recoveryPlan.includes('ohne den Archivbranch blind auf `main` zu kippen') || !/Control[\s\S]*Studio[\s\S]*Prompt Queue[\s\S]*Restore/.test(recoveryPlan)) throw new Error('Recovery plan lacks atomic rescue rules.');
for (const marker of ['LR0','LR1','LR2','LR3','LR4','LR5','LR6']) if(!recoveryPlan.includes(marker)) throw new Error(`Recovery sequence marker missing: ${marker}`);
if (!truthAudit.includes('3979c65c4cc15f4ed4b7c72c92f559ace1c747ac') || !truthAudit.includes('Zurückgezogene Aussagen')) throw new Error('Truth audit lacks the critical product-loss finding.');
for (const marker of ['CLOSED_VERIFIED','29133307545','29143665894','Issue #39']) if(!closureAudit.includes(marker)) throw new Error(`Closure audit marker missing: ${marker}`);
const renderScript=await readFile(new URL('scripts/render_m1.py',root),'utf8'); for(const marker of ['ffmpeg','ffprobe','technical-proof-only']) if(!renderScript.includes(marker)) throw new Error(`M1 renderer marker missing: ${marker}`);
const scanner=await readFile(new URL('scripts/recover_assets.py',root),'utf8'); for(const marker of ['readOnlySourceScan','sha256','followlinks=False','_recovery_reports']) if(!scanner.includes(marker)) throw new Error(`Recovery scanner marker missing: ${marker}`);
console.log(JSON.stringify({status:'pass',repository:truth.repository,lineStatus:truth.status,activeGate:'LR2',trackingIssue:45,selectedPilot:'pilot-das-zimmer',decisionStatus:decisionRecord.status,currentEvidenceCoveragePercent:null,productionAppStatus:truth.productArchitecture.productionFoundation.status,lr0Closure:lr0Closure.status}));
