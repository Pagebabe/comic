import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { assertReadOnlyReleaseHtml, buildReleaseManifest, buildStartklarMatrix, buildTraceGraph, evaluateFailureScenario, renderReleaseHtml, stableHash, verifyReleaseManifest } from './integration.mjs';

const moduleIds=['MKT0-001','MKT0-002','MKT0-003','MKT0-004','MKT0-005','MKT0-006','MKT0-007','MKT0-008'];
const evidencePaths=moduleIds.map(id=>`growth-os/evidence/${id}.md`);
const artifactContents={};
for(const path of evidencePaths){ if(!existsSync(path)) throw new Error(`Missing evidence: ${path}`); artifactContents[path]=readFileSync(path,'utf8'); }
const modules=moduleIds.map((moduleId,index)=>({moduleId,ruleVersion:`mkt0-${String(index+1).padStart(3,'0')}.v1`,state:'PROVEN',ciRunId:'repository-evidence',claims:['offline-shadow-proof'],artifacts:[{path:evidencePaths[index],sha256:stableHash(artifactContents[evidencePaths[index]])}]}));
const manifest=buildReleaseManifest({schemaVersion:1,releaseId:'mkt0-offline-rc1',generatedAt:'2026-07-11T12:00:00.000Z',correlationId:'corr-mkt0-rc1',modules});
verifyReleaseManifest(manifest,artifactContents);
const steps=moduleIds.map((moduleId,index)=>({stepId:`step-${index+1}`,moduleId,causationId:index===0?null:`step-${index}`,state:'PASS',evidenceRef:evidencePaths[index]}));
const trace=buildTraceGraph({correlationId:'corr-mkt0-rc1',steps});
const startklar=buildStartklarMatrix({manifest});
const failures=['KILL_SWITCH','AUTH_NOT_READY','RATE_LIMIT','WEBHOOK_REPLAY','MANIFEST_TAMPER','INSUFFICIENT_METRICS'].map(type=>evaluateFailureScenario({type}));
const report={schemaVersion:1,ruleVersion:'mkt0-009.v1',provenance:'synthetic_and_repository_evidence_only',manifest,trace,startklar,failures,networkUsed:false,liveActionsExecuted:false,productionReady:false};
const html=renderReleaseHtml(report);assertReadOnlyReleaseHtml(html);
mkdirSync('output/growth-os',{recursive:true});
writeFileSync('output/growth-os/mkt0-release-candidate.json',`${JSON.stringify(report,null,2)}\n`);
writeFileSync('output/growth-os/mkt0-release-candidate.html',html);
console.log(JSON.stringify({status:'pass',releaseState:manifest.releaseState,modules:modules.length,failures:failures.length,productionReady:false,networkUsed:false,liveActionsExecuted:false}));
