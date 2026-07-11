import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const required = [
  'README.md','index.html','app.js','lr1-ui.js','audit-ui.js','styles.css','m1.css','audit.css','package.json',
  'api/bot.mjs','api/health.mjs','lib/context.mjs','lib/browser-director.mjs',
  'project/project.json','project/truth-state.json','project/line-reset-closure.json','project/canon-candidates.json','project/pilot-decision-packet.json','project/canon.json','project/evidence-closure.json',
  'project/character-library.json','project/character-production-sheets.json','project/lora-training-sheets.json',
  'docs/TRUTH_AUDIT_2026-07-11.md','docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md','docs/PILOT_DECISION_PACKET_2026-07-11.md','docs/PRODUCTION_APP_RECOVERY_PLAN.md',
  'scripts/recover_assets.py','scripts/render_m1.py','.github/workflows/ci.yml','.github/workflows/pages.yml'
];
for (const file of required) await access(new URL(file, root));
const [project, truth, lr0Closure, candidates, decisionPacket, canon, closure, characters, sheets, loras] = await Promise.all([
  'project/project.json','project/truth-state.json','project/line-reset-closure.json','project/canon-candidates.json','project/pilot-decision-packet.json','project/canon.json','project/evidence-closure.json','project/character-library.json','project/character-production-sheets.json','project/lora-training-sheets.json'
].map(readJson));
if (truth.repository !== 'Pagebabe/comic' || truth.status !== 'recovery_line_active' || truth.authority !== 'current_project_truth') throw new Error('Truth state is not authoritative.');
if (truth.trackingIssue !== 38 || truth.nextSequence?.find((item) => item.id === 'LR0')?.status !== 'done' || truth.nextSequence?.find((item) => item.id === 'LR1')?.status !== 'active_human_decision_required') throw new Error('LR0 closure or LR1 activation drifted.');
if (truth.evidence.currentCoveragePercent !== null || truth.evidence.percentageClaimAllowed !== false) throw new Error('Current evidence must not expose a percentage.');
if (truth.canon.status !== 'decision_required' || truth.canon.selectedPilot !== null) throw new Error('Pilot canon must remain undecided.');
if (truth.productArchitecture.currentMain.type !== 'audit_dashboard_shell') throw new Error('Current main architecture must be disclosed as an audit shell.');
if (truth.productArchitecture.productionFoundation.branch !== 'archive/legacy-comic-2026-07-10') throw new Error('Archive rescue source drifted.');
if (lr0Closure.status !== 'closed_verified' || lr0Closure.pullRequest !== 37 || lr0Closure.mergeCommit !== '47b513c31d5326efdf5bd8c81e835233f97b6b47' || lr0Closure.ci.runId !== 29133307545 || lr0Closure.deployment.runId !== 29143665894 || lr0Closure.nextGate.trackingIssue !== 38) throw new Error('LR0 closure proof drifted.');
if (candidates.selectedCandidateId !== null || candidates.candidates?.length !== 2) throw new Error('Exactly two unselected pilot candidates are required.');
if (candidates.candidates.some((item) => item.status !== 'candidate_not_selected')) throw new Error('A pilot candidate was selected without human approval.');
if (candidates.decisionPacket?.status !== 'ready_for_human_decision' || candidates.decisionPacket?.advisoryRecommendation?.status !== 'advisory_not_selection') throw new Error('Canon candidates do not expose the advisory LR1 decision packet correctly.');
if (decisionPacket.repository !== 'Pagebabe/comic' || decisionPacket.status !== 'ready_for_human_decision' || decisionPacket.trackingIssue !== 38) throw new Error('Pilot decision packet is not ready for LR1.');
if (decisionPacket.selectionAuthority !== 'explicit_human_project_decision' || decisionPacket.selectedCandidateId !== null || decisionPacket.requiredDecisionRecord?.decidedBy !== null) throw new Error('Pilot decision packet crossed the human decision boundary.');
if (decisionPacket.advisoryRecommendation?.candidateId !== 'pilot-das-zimmer' || decisionPacket.advisoryRecommendation?.status !== 'advisory_not_selection') throw new Error('Pilot recommendation must remain advisory and point to Das Zimmer.');
if (decisionPacket.candidates?.['pilot-der-solidarpreis']?.sourceReadiness !== 'blocked_original_source_missing') throw new Error('Der Solidarpreis source gap is not represented honestly.');
if (canon.authorityStatus !== 'candidate_only_not_user_confirmed' || canon.selectedPilot !== null) throw new Error('Old canon file still overclaims authority.');
if (closure.status !== 'historical_bounded_snapshot' || closure.currentCompletenessClaimAllowed !== false || closure.snapshotThroughPullRequest !== 30) throw new Error('Historical closure is not bounded correctly.');
if (closure.classifications?.['CLAIM-016-complete-historical-pr-backfill'] !== 'disproven') throw new Error('Old complete-history claim must remain disproven.');
if (project.lineStatus !== 'recovery_line_active' || project.activeMilestone !== 'LR1' || project.activeTrackingIssue !== 38 || project.canonAuthority !== 'decision_required') throw new Error('Project state is not on LR1.');
if (project.inventory.visualCharacterMastersLocked !== 0 || project.inventory.approvedVoiceSamples !== 0 || project.inventory.finishedEpisodes !== 0) throw new Error('Unbuilt production assets were claimed.');
if (characters.length !== 13 || sheets.length !== 9 || loras.length !== 6) throw new Error('Preserved library counts drifted.');
for (const file of ['app.js','lr1-ui.js','audit-ui.js','api/bot.mjs','api/health.mjs','lib/context.mjs','lib/browser-director.mjs','scripts/check.mjs','scripts/check_evidence_chain.mjs','scripts/build_visual_proof.mjs']) {
  const result=spawnSync(process.execPath,['--check',new URL(file,root).pathname],{encoding:'utf8'}); if(result.status!==0) throw new Error(`Syntax check failed for ${file}: ${result.stderr}`);
}
for (const file of ['scripts/recover_assets.py','scripts/render_m1.py']) { const result=spawnSync('python3',['-m','py_compile',new URL(file,root).pathname],{encoding:'utf8'}); if(result.status!==0) throw new Error(`Python syntax failed for ${file}: ${result.stderr}`); }
const [readme,index,phaseUi,audit,context,recoveryPlan,truthAudit,closureAudit,decisionSheet] = await Promise.all(['README.md','index.html','lr1-ui.js','audit-ui.js','lib/context.mjs','docs/PRODUCTION_APP_RECOVERY_PLAN.md','docs/TRUTH_AUDIT_2026-07-11.md','docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md','docs/PILOT_DECISION_PACKET_2026-07-11.md'].map((path)=>readFile(new URL(path,root),'utf8')));
for (const marker of ['Produktarchitektur:       RECOVERY','aktives Gate:             LR1 PILOTENTSCHEIDUNG','Pilot-Canon:              DECISION_REQUIRED','keine Prozentzahl']) if(!readme.includes(marker)) throw new Error(`README truth marker missing: ${marker}`);
for (const marker of ['Line Reset abgeschlossen','LR1 · Issue #38','Pilot menschlich auswählen','Pilot-Entscheidungsblatt','Empfehlung ohne Auswahl','src="./lr1-ui.js"','id="m1Video"']) if(!index.includes(marker)) throw new Error(`Dashboard marker missing: ${marker}`);
for (const marker of ['LR0 TRUTH RESET','AKTIVES GATE','Issue #38','truth.nextSequence','startsWith(\'active\')']) if(!phaseUi.includes(marker)) throw new Error(`LR1 UI marker missing: ${marker}`);
for (const marker of ['AKTUELLE AUTORITÄT','HISTORISCHER SNAPSHOT','100%-Closure-Manifest','Alle fünf Vorfälle des alten Snapshots']) if(!audit.includes(marker)) throw new Error(`Audit UI marker missing: ${marker}`);
for (const marker of ['READY_FOR_HUMAN_DECISION','Beratende Empfehlung, keine Auswahl','Empfohlen wird `Das Zimmer`','Originalquelle','selectedCandidateId` bleibt `null`']) if(!decisionSheet.includes(marker)) throw new Error(`Pilot decision sheet marker missing: ${marker}`);
for (const forbidden of ['BEWEISKETTE 100% GESCHLOSSEN','Text-Canon 4/4 gesperrt','Story und 4/4 Text-Character-Bibles bleiben unverändert']) if(index.includes(forbidden)||phaseUi.includes(forbidden)||context.includes(forbidden)) throw new Error(`Current truth still contains forbidden claim: ${forbidden}`);
if (!recoveryPlan.includes('ohne den Archivbranch blind auf `main` zu kippen') || !/Control[\s\S]*Studio[\s\S]*Prompt Queue[\s\S]*Restore/.test(recoveryPlan)) throw new Error('Recovery plan lacks atomic rescue rules.');
for (const marker of ['LR0','LR1','LR2','LR3','LR4','LR5','LR6']) if(!recoveryPlan.includes(marker)) throw new Error(`Recovery sequence marker missing: ${marker}`);
if (!truthAudit.includes('3979c65c4cc15f4ed4b7c72c92f559ace1c747ac') || !truthAudit.includes('Zurückgezogene Aussagen')) throw new Error('Truth audit lacks the critical product-loss finding.');
for (const marker of ['CLOSED_VERIFIED','29133307545','29143665894','Issue #39']) if(!closureAudit.includes(marker)) throw new Error(`Closure audit marker missing: ${marker}`);
const renderScript=await readFile(new URL('scripts/render_m1.py',root),'utf8'); for(const marker of ['ffmpeg','ffprobe','technical-proof-only']) if(!renderScript.includes(marker)) throw new Error(`M1 renderer marker missing: ${marker}`);
const scanner=await readFile(new URL('scripts/recover_assets.py',root),'utf8'); for(const marker of ['readOnlySourceScan','sha256','followlinks=False','_recovery_reports']) if(!scanner.includes(marker)) throw new Error(`Recovery scanner marker missing: ${marker}`);
console.log(JSON.stringify({status:'pass',repository:truth.repository,lineStatus:truth.status,activeGate:'LR1',canonStatus:truth.canon.status,currentEvidenceCoveragePercent:null,productionAppStatus:truth.productArchitecture.productionFoundation.status,lr0Closure:lr0Closure.status,decisionPacket:decisionPacket.status,recommendationStatus:decisionPacket.advisoryRecommendation.status,selectedCandidateId:null}));
