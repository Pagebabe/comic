import { createHash } from 'node:crypto';

export const INTEGRATION_SCHEMA_VERSION = 1;
export const INTEGRATION_RULE_VERSION = 'mkt0-009.v1';
export const RELEASE_STATES = Object.freeze(['PROVEN','NOT_PROVEN','BLOCKED_EXTERNAL','HUMAN_APPROVAL_REQUIRED']);

export class IntegrationValidationError extends Error {
  constructor(message, details={}) { super(message); this.name='IntegrationValidationError'; this.details=details; }
}

const reqObj=(v,f)=>{ if(!v||typeof v!=='object'||Array.isArray(v)) throw new IntegrationValidationError(`Invalid object: ${f}`); return v; };
const reqStr=(v,f)=>{ if(typeof v!=='string'||!v.trim()) throw new IntegrationValidationError(`Invalid string: ${f}`); return v.trim(); };
const reqArr=(v,f)=>{ if(!Array.isArray(v)) throw new IntegrationValidationError(`Invalid array: ${f}`); return v; };
const reqTs=(v,f)=>{ const x=reqStr(v,f); if(!x.includes('T')||!Number.isFinite(Date.parse(x))) throw new IntegrationValidationError(`Invalid timestamp: ${f}`); return x; };
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
export const stableHash=v=>createHash('sha256').update(JSON.stringify(canon(v))).digest('hex');

export function createModuleEvidence(input){
  const v=reqObj(input,'moduleEvidence');
  const state=reqStr(v.state,'state');
  if(!RELEASE_STATES.includes(state)) throw new IntegrationValidationError('Unsupported evidence state',{state});
  const artifacts=reqArr(v.artifacts,'artifacts').map((a,i)=>{ const x=reqObj(a,`artifacts[${i}]`); return Object.freeze({path:reqStr(x.path,'artifact.path'),sha256:reqStr(x.sha256,'artifact.sha256')}); }).sort((a,b)=>a.path.localeCompare(b.path));
  return Object.freeze({moduleId:reqStr(v.moduleId,'moduleId'),ruleVersion:reqStr(v.ruleVersion,'ruleVersion'),state,ciRunId:reqStr(v.ciRunId,'ciRunId'),artifacts:Object.freeze(artifacts),claims:Object.freeze(reqArr(v.claims??[],'claims').map(String).sort()),networkUsed:false,liveActionsExecuted:false});
}

export function buildReleaseManifest(input){
  const v=reqObj(input,'release');
  if(v.schemaVersion!==INTEGRATION_SCHEMA_VERSION) throw new IntegrationValidationError('Invalid integration schemaVersion');
  const modules=reqArr(v.modules,'modules').map(createModuleEvidence).sort((a,b)=>a.moduleId.localeCompare(b.moduleId));
  const ids=new Set();
  for(const m of modules){ if(ids.has(m.moduleId)) throw new IntegrationValidationError('Duplicate module evidence',{moduleId:m.moduleId}); ids.add(m.moduleId); }
  const required=['MKT0-001','MKT0-002','MKT0-003','MKT0-004','MKT0-005','MKT0-006','MKT0-007','MKT0-008'];
  const missing=required.filter(id=>!ids.has(id));
  const blockers=[];
  if(missing.length) blockers.push(`MISSING_MODULES:${missing.join(',')}`);
  for(const m of modules){ if(m.state!=='PROVEN') blockers.push(`${m.moduleId}:${m.state}`); if(!m.artifacts.length) blockers.push(`${m.moduleId}:NO_ARTIFACTS`); }
  const core={schemaVersion:1,ruleVersion:INTEGRATION_RULE_VERSION,releaseId:reqStr(v.releaseId,'releaseId'),generatedAt:reqTs(v.generatedAt,'generatedAt'),correlationId:reqStr(v.correlationId,'correlationId'),modules,blockers:Object.freeze(blockers.sort()),mode:'shadow',networkUsed:false,liveActionsExecuted:false};
  return Object.freeze({...core,manifestHash:stableHash(core),releaseState:blockers.length?'NOT_PROVEN':'PROVEN'});
}

export function verifyReleaseManifest(manifest, artifactContents){
  const m=reqObj(manifest,'manifest'); const contents=reqObj(artifactContents,'artifactContents');
  const copy={...m}; delete copy.manifestHash; delete copy.releaseState;
  if(stableHash(copy)!==m.manifestHash) throw new IntegrationValidationError('Release manifest hash mismatch');
  const failures=[];
  for(const mod of m.modules){
    for(const artifact of mod.artifacts){
      if(!(artifact.path in contents)) failures.push(`${artifact.path}:MISSING`);
      else if(stableHash(contents[artifact.path])!==artifact.sha256) failures.push(`${artifact.path}:HASH_MISMATCH`);
    }
  }
  if(failures.length) throw new IntegrationValidationError('Release artifact verification failed',{failures});
  return Object.freeze({verified:true,artifactCount:m.modules.reduce((n,x)=>n+x.artifacts.length,0),manifestHash:m.manifestHash,networkUsed:false});
}

export function buildTraceGraph(input){
  const v=reqObj(input,'trace'); const correlationId=reqStr(v.correlationId,'correlationId');
  const steps=reqArr(v.steps,'steps').map((s,i)=>{ const x=reqObj(s,`steps[${i}]`); return Object.freeze({stepId:reqStr(x.stepId,'stepId'),moduleId:reqStr(x.moduleId,'moduleId'),causationId:x.causationId==null?null:reqStr(x.causationId,'causationId'),state:reqStr(x.state,'state'),evidenceRef:reqStr(x.evidenceRef,'evidenceRef'),sequence:i+1}); });
  const seen=new Set(); for(const step of steps){ if(seen.has(step.stepId)) throw new IntegrationValidationError('Duplicate trace step',{stepId:step.stepId}); if(step.causationId&&!seen.has(step.causationId)) throw new IntegrationValidationError('Trace causation points forward or missing',{stepId:step.stepId,causationId:step.causationId}); seen.add(step.stepId); }
  return Object.freeze({schemaVersion:1,ruleVersion:INTEGRATION_RULE_VERSION,correlationId,steps:Object.freeze(steps),traceHash:stableHash({correlationId,steps}),networkUsed:false,liveActionsExecuted:false});
}

export function buildStartklarMatrix({manifest,external={}}){
  reqObj(manifest,'manifest'); reqObj(external,'external');
  const rows=[
    {area:'LOCAL_SHADOW_CORE',state:manifest.releaseState==='PROVEN'?'PROVEN':'NOT_PROVEN',reason:manifest.releaseState},
    {area:'NETWORK_CONNECTIVITY',state:'BLOCKED_EXTERNAL',reason:'NO_AUTHORIZED_RUNTIME'},
    {area:'OAUTH_AND_PROVIDER_APPS',state:'BLOCKED_EXTERNAL',reason:'NO_CREDENTIALS_OR_APP_APPROVAL'},
    {area:'LIVE_PUBLISHING',state:'HUMAN_APPROVAL_REQUIRED',reason:'LIVE_GATE_LOCKED'},
    {area:'REMOTE_DATABASE',state:'BLOCKED_EXTERNAL',reason:'NO_REMOTE_MIGRATION_PROOF'},
    {area:'REMOTE_BACKUP_RESTORE',state:'NOT_PROVEN',reason:'DRY_RUN_ONLY'},
    {area:'EXTERNAL_AUDIT_ANCHOR',state:'NOT_PROVEN',reason:'LOCAL_ONLY'},
    {area:'MAIN_INTEGRATION',state:'HUMAN_APPROVAL_REQUIRED',reason:'RECOVERY_STOP_RULE'}
  ];
  return Object.freeze({schemaVersion:1,ruleVersion:INTEGRATION_RULE_VERSION,rows:Object.freeze(rows),shadowReleaseCandidate:manifest.releaseState==='PROVEN',productionReady:false,networkUsed:false,liveActionsExecuted:false});
}

export function evaluateFailureScenario(input){
  const v=reqObj(input,'failure'); const type=reqStr(v.type,'type');
  const map={KILL_SWITCH:'SAFE_BLOCKED',AUTH_NOT_READY:'SAFE_BLOCKED',RATE_LIMIT:'SAFE_BACKOFF',WEBHOOK_REPLAY:'SAFE_REJECTED',MANIFEST_TAMPER:'SAFE_REJECTED',INSUFFICIENT_METRICS:'SAFE_HOLD'};
  if(!(type in map)) throw new IntegrationValidationError('Unknown failure scenario',{type});
  return Object.freeze({type,outcome:map[type],networkUsed:false,liveActionsExecuted:false,recoveryRequiresHuman:['KILL_SWITCH','MANIFEST_TAMPER'].includes(type)});
}

export function renderReleaseHtml(report){
  const r=reqObj(report,'report');
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const rows=r.startklar.rows.map(x=>`<tr><td>${esc(x.area)}</td><td>${esc(x.state)}</td><td>${esc(x.reason)}</td></tr>`).join('');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; script-src 'none'"><meta name="referrer" content="no-referrer"><title>MKT0 Release Candidate</title><style>body{font-family:system-ui;margin:2rem;background:#101216;color:#eef}table{border-collapse:collapse;width:100%}td,th{border:1px solid #445;padding:.6rem}code{word-break:break-all}.warn{padding:1rem;background:#3a2810}</style></head><body><h1>MKT0 Offline Release Candidate</h1><p class="warn">SHADOW ONLY · KEINE PRODUKTIVE LIVE-BEREITSCHAFT</p><p>Release: ${esc(r.manifest.releaseId)}</p><p>Manifest: <code>${esc(r.manifest.manifestHash)}</code></p><p>Trace: <code>${esc(r.trace.traceHash)}</code></p><table><thead><tr><th>Bereich</th><th>Status</th><th>Grund</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

export function assertReadOnlyReleaseHtml(html){
  const text=reqStr(html,'html');
  if(!text.includes("default-src 'none'")) throw new IntegrationValidationError('Missing restrictive CSP');
  if(/<(script|form|button|input|textarea|select)\b/i.test(text)||/https?:\/\//i.test(text)||/fetch\s*\(/i.test(text)) throw new IntegrationValidationError('Release HTML is not read-only/offline');
  return true;
}
