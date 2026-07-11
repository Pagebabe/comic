import test from 'node:test';
import assert from 'node:assert/strict';
import { assertReadOnlyReleaseHtml, buildReleaseManifest, buildStartklarMatrix, buildTraceGraph, createModuleEvidence, evaluateFailureScenario, renderReleaseHtml, stableHash, verifyReleaseManifest } from '../growth-os/integration.mjs';

const contents=Object.fromEntries(Array.from({length:8},(_,i)=>[`artifact-${i+1}`,{module:`MKT0-00${i+1}`,ok:true}]));
const modules=Object.entries(contents).map(([path,content],i)=>({moduleId:`MKT0-00${i+1}`,ruleVersion:`mkt0-00${i+1}.v1`,state:'PROVEN',ciRunId:`ci-${i+1}`,claims:['offline'],artifacts:[{path,sha256:stableHash(content)}]}));
const release=()=>buildReleaseManifest({schemaVersion:1,releaseId:'mkt0-rc1',generatedAt:'2026-07-11T12:00:00.000Z',correlationId:'corr-001',modules});

test('module evidence is deterministic and secret free',()=>assert.deepEqual(createModuleEvidence(modules[0]),createModuleEvidence(modules[0])));
test('release manifest is deterministic and proven with all modules',()=>{const a=release(),b=release();assert.deepEqual(a,b);assert.equal(a.releaseState,'PROVEN');});
test('missing module blocks release',()=>{const m=buildReleaseManifest({schemaVersion:1,releaseId:'x',generatedAt:'2026-07-11T12:00:00.000Z',correlationId:'c',modules:modules.slice(0,7)});assert.equal(m.releaseState,'NOT_PROVEN');});
test('non-proven module blocks release',()=>{const changed=modules.map((m,i)=>i===2?{...m,state:'NOT_PROVEN'}:m);assert.equal(buildReleaseManifest({schemaVersion:1,releaseId:'x',generatedAt:'2026-07-11T12:00:00.000Z',correlationId:'c',modules:changed}).releaseState,'NOT_PROVEN');});
test('artifact hashes verify',()=>assert.equal(verifyReleaseManifest(release(),contents).verified,true));
test('tampered artifact is rejected',()=>assert.throws(()=>verifyReleaseManifest(release(),{...contents,'artifact-2':{bad:true}}),/verification failed/));
test('tampered manifest is rejected',()=>assert.throws(()=>verifyReleaseManifest({...release(),releaseId:'changed'},contents),/hash mismatch/));
test('trace graph preserves causal order',()=>{const t=buildTraceGraph({correlationId:'corr-001',steps:[{stepId:'s1',moduleId:'MKT0-001',causationId:null,state:'PASS',evidenceRef:'e1'},{stepId:'s2',moduleId:'MKT0-002',causationId:'s1',state:'PASS',evidenceRef:'e2'}]});assert.equal(t.steps[1].causationId,'s1');});
test('forward causation is rejected',()=>assert.throws(()=>buildTraceGraph({correlationId:'c',steps:[{stepId:'s2',moduleId:'MKT0-002',causationId:'s1',state:'PASS',evidenceRef:'e2'}]}),/causation/));
test('startklar separates shadow RC from production',()=>{const m=buildStartklarMatrix({manifest:release()});assert.equal(m.shadowReleaseCandidate,true);assert.equal(m.productionReady,false);});
test('all defined failures remain safe',()=>{for(const type of ['KILL_SWITCH','AUTH_NOT_READY','RATE_LIMIT','WEBHOOK_REPLAY','MANIFEST_TAMPER','INSUFFICIENT_METRICS']){const r=evaluateFailureScenario({type});assert.equal(r.networkUsed,false);assert.equal(r.liveActionsExecuted,false);assert.match(r.outcome,/^SAFE_/);}});
test('unknown failures are rejected',()=>assert.throws(()=>evaluateFailureScenario({type:'SURPRISE'}),/Unknown/));
test('release HTML is escaped and read-only',()=>{const manifest={...release(),releaseId:'<script>x</script>'};const trace=buildTraceGraph({correlationId:'c',steps:[]});const html=renderReleaseHtml({manifest,trace,startklar:buildStartklarMatrix({manifest})});assert.doesNotMatch(html,/<script>x/);assert.equal(assertReadOnlyReleaseHtml(html),true);});
test('release HTML rejects forms and network urls',()=>assert.throws(()=>assertReadOnlyReleaseHtml("<meta http-equiv='Content-Security-Policy' content=\"default-src 'none'\"><form></form>"),/not read-only/));
test('release manifest never claims network or live actions',()=>{const m=release();assert.equal(m.networkUsed,false);assert.equal(m.liveActionsExecuted,false);});
