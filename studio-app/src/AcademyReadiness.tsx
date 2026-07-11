import { useEffect, useState } from 'react';
import './academy-readiness.css';

type Gate = { id: string; title: string; status: 'CLOSED_VERIFIED'|'PARTIAL'|'OPEN'; existingProof: string[]; missingProof: string[] };
type Readiness = {
  status: string;
  currentScore: { display: string };
  academyBoundary: { productionReady:boolean; beginnerReady:boolean; creativeApprovalGranted:boolean; imageGenerationAllowed:boolean; growthOsIntegrated:boolean };
  parallelLineBoundary: { growthOsStatus:string; liveReady:boolean; mainIntegrationAllowed:boolean; sharedIntegrationSmokePassed:boolean };
  gates: Gate[];
};
type Acceptance = { status:string; requiredScore:number; humanObservationRequired:boolean; tasks:Array<{id:string;prompt:string}>; closureRule:string };

async function loadJson<T>(path:string):Promise<T>{
  const response=await fetch(new URL(path,window.location.href),{cache:'no-store'});
  if(!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export function AcademyReadiness(){
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const [acceptance,setAcceptance]=useState<Acceptance|null>(null);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    Promise.all([
      loadJson<Readiness>('../project/production-readiness-v1.json'),
      loadJson<Acceptance>('../project/novice-acceptance-template.json')
    ]).then(([r,a])=>{setReadiness(r);setAcceptance(a);}).catch((e)=>setError(String(e)));
  },[]);

  if(error) return <section className="panel warning" data-testid="academy-readiness-error">Readiness blockiert: {error}</section>;
  if(!readiness||!acceptance) return <section className="panel">Readiness wird geladen …</section>;

  const boundaries=[
    ['PRODUKTIONSREIFE',readiness.academyBoundary.productionReady?'ERREICHT':'NICHT ERREICHT'],
    ['ANFÄNGER-ABNAHME',readiness.academyBoundary.beginnerReady?'BESTANDEN':'NOCH OFFEN'],
    ['BILDGENERIERUNG',readiness.academyBoundary.imageGenerationAllowed?'ERLAUBT':'GESPERRT'],
    ['KREATIVE FREIGABE',readiness.academyBoundary.creativeApprovalGranted?'ERTEILT':'NICHT ERTEILT'],
    ['GROWTH OS',readiness.academyBoundary.growthOsIntegrated?'INTEGRIERT':'GETRENNT']
  ];

  return <section className="academy-readiness" data-testid="academy-readiness">
    <div className="panel academy-readiness-head">
      <div>
        <p className="eyebrow">OPS1 · PRODUCTION-READINESS · ISSUE #95</p>
        <h2>Geführt und technisch bewiesen. Noch nicht produktionsreif.</h2>
        <p>Reale Master, eine geprüfte Episode und ein beobachteter Nullwissen-Lauf fehlen weiterhin.</p>
      </div>
      <div className="academy-readiness-score" data-testid="academy-readiness-score">
        <span>{readiness.status}</span><strong>{readiness.currentScore.display}</strong><small>10/10 erst bei zehnmal CLOSED_VERIFIED</small>
      </div>
    </div>

    <div className="academy-boundary-cards">{boundaries.map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>

    <div className="academy-readiness-grid" data-testid="academy-readiness-gates">
      {readiness.gates.map((gate)=><article key={gate.id} data-status={gate.status}>
        <header><span>{gate.id}</span><strong>{gate.title}</strong><em>{gate.status}</em></header>
        <p><b>Belegt:</b> {gate.existingProof.length?gate.existingProof.join(' · '):'noch kein Abschlussbeweis'}</p>
        <p><b>Fehlt:</b> {gate.missingProof.length?gate.missingProof.join(' · '):'nichts'}</p>
      </article>)}
    </div>

    <div className="panel academy-acceptance" data-testid="academy-novice-acceptance">
      <p className="eyebrow">NULLWISSEN-ABNAHME · {acceptance.status}</p>
      <h2>{acceptance.tasks.length} Aufgaben · {acceptance.requiredScore}/{acceptance.requiredScore} erforderlich</h2>
      <p>Eine echte beobachtende Person ist Pflicht: <strong>{acceptance.humanObservationRequired?'ja':'nein'}</strong>.</p>
      <ol>{acceptance.tasks.map((task)=><li key={task.id}><b>{task.id}</b> {task.prompt}</li>)}</ol>
      <p className="boundary">{acceptance.closureRule}</p>
      <div className="academy-readiness-links">
        <a href="../docs/NOVICE_ACCEPTANCE_PROTOCOL.md">Abnahmeprotokoll</a>
        <a href="../project/novice-acceptance-template.json">Record-Vorlage</a>
        <a href="../project/production-readiness-v1.json">10-Gate-Matrix</a>
      </div>
    </div>

    <div className="panel academy-growth-boundary" data-testid="academy-growth-boundary">
      <p className="eyebrow">PARALLELE MARKETING-LINIE</p><h2>Growth OS bleibt isoliert.</h2>
      <p>Status: <strong>{readiness.parallelLineBoundary.growthOsStatus}</strong> · Live Ready: <strong>{readiness.parallelLineBoundary.liveReady?'ja':'nein'}</strong> · gemeinsamer Integrations-Smoke: <strong>{readiness.parallelLineBoundary.sharedIntegrationSmokePassed?'bestanden':'offen'}</strong> · Integration in main: <strong>{readiness.parallelLineBoundary.mainIntegrationAllowed?'erlaubt':'gesperrt'}</strong>.</p>
    </div>
  </section>;
}
