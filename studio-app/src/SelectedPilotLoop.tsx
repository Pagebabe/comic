import { useEffect, useMemo, useState } from 'react';
import { LOOP_STATIONS } from './production-loop.mjs';
import {
  DETAIL_REVIEW_STATUS,
  SELECTED_PILOT_PACKAGE_STORAGE_KEY,
  SELECTED_PILOT_STORAGE_KEY,
  applySelectedPilotLettering,
  createSelectedPilotPackage,
  createSelectedPilotState,
  importSelectedPilotMetadata,
  markSelectedPilotRestorePassed,
  restoreSelectedPilotPackage,
  reviewSelectedPilotForTransport,
  runSelectedPilotQa,
  selectedPilotStationMap,
  serializeSelectedPilotPackage
} from './selected-pilot-loop.mjs';

function readStoredState() {
  try {
    const raw = window.localStorage.getItem(SELECTED_PILOT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : createSelectedPilotState();
  } catch {
    return createSelectedPilotState();
  }
}

function readStoredPackage() {
  return window.localStorage.getItem(SELECTED_PILOT_PACKAGE_STORAGE_KEY) || '';
}

export function SelectedPilotLoop() {
  const [state, setState] = useState<any>(() => readStoredState());
  const [packageText, setPackageText] = useState(() => readStoredPackage());
  const [packageHash, setPackageHash] = useState('');
  const [stateHash, setStateHash] = useState('');
  const [restoreHash, setRestoreHash] = useState('');
  const [message, setMessage] = useState('LR4 ist öffentlich geschlossen. Dieser Lauf wiederholt den Beweis lokal; alle Details bleiben REVIEW_REQUIRED.');
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (state) window.localStorage.setItem(SELECTED_PILOT_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const stations = useMemo(() => state ? selectedPilotStationMap(state) : {}, [state]);
  const allPassed = state && LOOP_STATIONS.every((station) => stations[station.id] === 'passed');
  const restoreMatch = Boolean(stateHash && restoreHash && stateHash === restoreHash);
  const dialogueCount = state?.panels?.flatMap((panel: any) => panel.dialogue).length || 0;
  const duration = state?.panels?.reduce((sum: number, panel: any) => sum + panel.durationSeconds, 0) || 0;

  function commit(next: any, nextMessage: string) {
    setState(next);
    setDeleted(false);
    setMessage(nextMessage);
  }

  function handleImport() {
    try {
      commit(importSelectedPilotMetadata(state), '8 Panel-Metadaten importiert. Null Bildbytes, null Provideraufrufe.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  function handleReview() {
    try {
      commit(reviewSelectedPilotForTransport(state), '8 technische Transportreviews dokumentiert. Keine visuelle oder inhaltliche Freigabe.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  function handleQa() {
    try {
      commit(runSelectedPilotQa(state), 'QA bestanden: Quellen, 8 Panels, 45,5 Sekunden und 10 Dialogkandidaten gebunden.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  function handleLettering() {
    try {
      commit(applySelectedPilotLettering(state), '10 Untertitelkandidaten angehängt. Dialogfreigabe bleibt falsch.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  async function handlePackage() {
    try {
      const pkg = await createSelectedPilotPackage(state);
      const text = serializeSelectedPilotPackage(pkg);
      setPackageText(text);
      setPackageHash(pkg.packageHash);
      setStateHash(pkg.stateHash);
      window.localStorage.setItem(SELECTED_PILOT_PACKAGE_STORAGE_KEY, text);
      commit(pkg.state, 'SelectedPilotEpisodePackage deterministisch erzeugt. Zustand kann jetzt gelöscht werden.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  function handleDelete() {
    window.localStorage.removeItem(SELECTED_PILOT_STORAGE_KEY);
    setState(null);
    setDeleted(true);
    setRestoreHash('');
    setMessage('STATE DELETED · Das-Zimmer-Produktionszustand vollständig entfernt.');
  }

  async function handleRestore() {
    try {
      const proof = await restoreSelectedPilotPackage(packageText || readStoredPackage());
      const restored = markSelectedPilotRestorePassed(proof.state, proof);
      setRestoreHash(proof.restoredStateHash);
      commit(restored, 'HASH MATCH · SELECTED PILOT DELETE AND RESTORE PASS');
    } catch (error) {
      setMessage(`RESTORE BLOCKED · ${String(error)}`);
    }
  }

  function handleReset() {
    window.localStorage.removeItem(SELECTED_PILOT_STORAGE_KEY);
    window.localStorage.removeItem(SELECTED_PILOT_PACKAGE_STORAGE_KEY);
    setState(createSelectedPilotState());
    setPackageText('');
    setPackageHash('');
    setStateHash('');
    setRestoreHash('');
    setDeleted(false);
    setMessage('LR4-Regressionstest zurückgesetzt. Der öffentliche Abschluss bleibt bestehen; alle Details bleiben REVIEW_REQUIRED.');
  }

  return (
    <main className="shell loop-shell" data-testid="selected-pilot-loop">
      <section className="hero loop-hero">
        <div>
          <p className="eyebrow">LR4 · CLOSED VERIFIED · REGRESSION ROUTE</p>
          <h1>Das Zimmer.<br />Acht Panels. Öffentlich wiederherstellbar.</h1>
          <p className="lead">PR #81 und Pages-Run 29152807415 haben den quellengebundenen Delete-and-Restore-Pfad öffentlich bewiesen. Diese Route kann denselben Beweis erneut ausführen. Dialog, Timing, Figuren, Orte, Visuals und Stimmen bleiben trotzdem REVIEW_REQUIRED.</p>
        </div>
        <div className="hero-state" data-testid="pilot-proof">
          <span>LR4 PUBLICLY VERIFIED</span>
          <strong>{restoreMatch && allPassed ? 'DELETE + RESTORE PASS' : 'REGRESSION READY'}</strong>
          <small>LR5 aktiv · Kein Visual-, Voice-, Dialog- oder Episoden-Lock.</small>
        </div>
      </section>

      <section className="cards" aria-label="Selected-Pilot-Paketstatus">
        <article><span>PILOT</span><strong>Das Zimmer</strong><p>menschlich ausgewählt, transportgeprüft, Detailfreigaben offen</p></article>
        <article><span>PANELS</span><strong data-testid="pilot-panel-count">{state?.panels?.length || 8}/8</strong><p>nur Metadaten, keine Bilder</p></article>
        <article><span>TIMING</span><strong data-testid="pilot-duration">{String(duration || 45.5).replace('.', ',')} s</strong><p>Kandidat, nicht final</p></article>
        <article><span>DIALOG</span><strong data-testid="pilot-dialogue-count">{dialogueCount || 10}</strong><p>{DETAIL_REVIEW_STATUS}</p></article>
      </section>

      <section className="loop-stations" aria-label="Selected-Pilot-Produktionsstationen">
        {LOOP_STATIONS.map((station, index) => {
          const status = state ? stations[station.id] : station.id === 'restore' && deleted ? 'ready' : 'deleted';
          return (
            <article key={station.id} data-station={station.id} data-status={status}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{station.label}</strong>
              <em>{status}</em>
            </article>
          );
        })}
      </section>

      <section className="loop-grid">
        <article className="panel loop-controls">
          <p className="eyebrow">KONTROLLIERTER LR4-REGRESSIONSTEST</p>
          <h2>Das-Zimmer-Paket Schritt für Schritt erneut prüfen</h2>
          <div className="loop-actions">
            <button data-testid="pilot-import" disabled={!state || stations.import === 'passed'} onClick={handleImport}>1 · Metadaten importieren</button>
            <button data-testid="pilot-review" disabled={!state || stations.import !== 'passed' || stations.review === 'passed'} onClick={handleReview}>2 · Transport reviewen</button>
            <button data-testid="pilot-qa" disabled={!state || stations.review !== 'passed' || stations.qa === 'passed'} onClick={handleQa}>3 · Quellen-QA</button>
            <button data-testid="pilot-letter" disabled={!state || stations.qa !== 'passed' || stations.lettering === 'passed'} onClick={handleLettering}>4 · Untertitelkandidaten</button>
            <button data-testid="pilot-package" disabled={!state || stations.lettering !== 'passed' || stations.package === 'passed'} onClick={handlePackage}>5 · Pilot-Package erzeugen</button>
            <button data-testid="pilot-delete" disabled={!state || stations.package !== 'passed'} onClick={handleDelete}>6 · Zustand löschen</button>
            <button data-testid="pilot-restore" disabled={!deleted || !packageText} onClick={handleRestore}>7 · Package wiederherstellen</button>
            <button data-testid="pilot-reset" className="ghost" onClick={handleReset}>Regressionstest zurücksetzen</button>
          </div>
          <p className="loop-message" data-testid="pilot-message">{message}</p>
        </article>

        <article className="panel loop-boundary">
          <p className="eyebrow">QUELLEN- UND FREIGABEGRENZE</p>
          <h2>Was LR4 transportiert, aber nicht genehmigt</h2>
          <ul>
            <li>4 Figurenkandidaten und 4 Ortskandidaten</li>
            <li>8 Panel- und Timingkandidaten</li>
            <li>10 Dialog- und Untertitelkandidaten</li>
            <li>0 Bildbytes und 0 externe Ausführungen</li>
            <li>0 kreative Freigaben und 0 fertige Episoden</li>
          </ul>
          <p className="boundary" data-testid="pilot-boundary">Alle Detailfelder: <strong>{DETAIL_REVIEW_STATUS}</strong>. Der Test beweist Transport und Wiederherstellbarkeit, nicht Qualität oder Canon.</p>
        </article>
      </section>

      <section className="hash-grid" data-testid="pilot-hashes">
        <article><span>PACKAGE SHA-256</span><code>{packageHash || 'noch nicht erzeugt'}</code></article>
        <article><span>STATE SHA-256 VOR LÖSCHUNG</span><code>{stateHash || 'noch nicht erzeugt'}</code></article>
        <article><span>STATE SHA-256 NACH RESTORE</span><code>{restoreHash || 'noch nicht wiederhergestellt'}</code></article>
        <article className={restoreMatch ? 'match' : ''}><span>GEGENPRÜFUNG</span><strong data-testid="pilot-restore-status">{restoreMatch ? 'HASH MATCH' : 'OFFEN'}</strong></article>
      </section>

      <details className="package-preview">
        <summary>SelectedPilotEpisodePackage JSON anzeigen</summary>
        <textarea readOnly value={packageText} aria-label="SelectedPilotEpisodePackage JSON" />
      </details>
    </main>
  );
}
