import { useEffect, useMemo, useState } from 'react';
import {
  LOOP_STATIONS,
  LOOP_STORAGE_KEY,
  PACKAGE_STORAGE_KEY,
  approveTechnicalReview,
  createEpisodePackage,
  createInitialLoopState,
  importSyntheticAsset,
  applyTechnicalLettering,
  markRestorePassed,
  restoreEpisodePackage,
  runTechnicalQa,
  serializeEpisodePackage,
  stationMap
} from './production-loop.mjs';

function readStoredState() {
  try {
    const raw = window.localStorage.getItem(LOOP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : createInitialLoopState();
  } catch {
    return createInitialLoopState();
  }
}

function readStoredPackage() {
  return window.localStorage.getItem(PACKAGE_STORAGE_KEY) || '';
}

export function ProductionLoop() {
  const [state, setState] = useState<any>(() => readStoredState());
  const [packageText, setPackageText] = useState(() => readStoredPackage());
  const [packageHash, setPackageHash] = useState('');
  const [stateHash, setStateHash] = useState('');
  const [restoreHash, setRestoreHash] = useState('');
  const [message, setMessage] = useState('Neutraler LR3-Testpfad bereit. Keine externe Ausführung.');
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (state) window.localStorage.setItem(LOOP_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const stations = useMemo(() => state ? stationMap(state) : {}, [state]);
  const allPassed = state && LOOP_STATIONS.every((station) => stations[station.id] === 'passed');
  const restoreMatch = Boolean(stateHash && restoreHash && stateHash === restoreHash);

  function commit(next: any, nextMessage: string) {
    setState(next);
    setDeleted(false);
    setMessage(nextMessage);
  }

  async function handleImport() {
    try {
      commit(await importSyntheticAsset(state), 'Synthetisches Testasset importiert. Keine Bilddatei und kein Netzwerk.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  function handleReview() {
    try {
      commit(approveTechnicalReview(state), 'Technischer Review dokumentiert. Keine visuelle Freigabe.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  function handleQa() {
    try {
      commit(runTechnicalQa(state), 'QA bestanden: Transportvertrag gültig, kreative Gates geschlossen.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  function handleLettering() {
    try {
      commit(applyTechnicalLettering(state), 'Technisches Test-Lettering gesetzt. Kein Pilotdialog freigegeben.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  async function handlePackage() {
    try {
      const pkg = await createEpisodePackage(state);
      const text = serializeEpisodePackage(pkg);
      setPackageText(text);
      setPackageHash(pkg.packageHash);
      setStateHash(pkg.stateHash);
      window.localStorage.setItem(PACKAGE_STORAGE_KEY, text);
      commit(pkg.state, 'EpisodePackage deterministisch erzeugt. Jetzt Zustand löschen und wiederherstellen.');
    } catch (error) {
      setMessage(String(error));
    }
  }

  function handleDelete() {
    window.localStorage.removeItem(LOOP_STORAGE_KEY);
    setState(null);
    setDeleted(true);
    setRestoreHash('');
    setMessage('STATE DELETED · lokaler Produktionszustand vollständig entfernt.');
  }

  async function handleRestore() {
    try {
      const proof = await restoreEpisodePackage(packageText || readStoredPackage());
      const restored = markRestorePassed(proof.state, proof);
      setRestoreHash(proof.restoredStateHash);
      commit(restored, 'HASH MATCH · DELETE AND RESTORE PASS');
    } catch (error) {
      setMessage(`RESTORE BLOCKED · ${String(error)}`);
    }
  }

  function handleReset() {
    window.localStorage.removeItem(LOOP_STORAGE_KEY);
    window.localStorage.removeItem(PACKAGE_STORAGE_KEY);
    setState(createInitialLoopState());
    setPackageText('');
    setPackageHash('');
    setStateHash('');
    setRestoreHash('');
    setDeleted(false);
    setMessage('Neutraler LR3-Testpfad zurückgesetzt.');
  }

  return (
    <main className="shell loop-shell" data-testid="production-loop">
      <section className="hero loop-hero">
        <div>
          <p className="eyebrow">LR3 · MINIMALER PRODUKTIONSLOOP</p>
          <h1>Ein neutraler Zustand.<br />Neun Stationen. Ein Restore-Beweis.</h1>
          <p className="lead">Der Pfad nutzt ausschließlich synthetische Metadaten. Keine Bildgenerierung, keine GPU, keine Stimme und keine kreative Freigabe. Erst wenn Package, Löschung und Restore denselben SHA-256-Zustand ergeben, gilt der technische Loop als Kandidat.</p>
        </div>
        <div className="hero-state" data-testid="loop-proof">
          <span>LR3 TECHNICAL CANDIDATE</span>
          <strong>{restoreMatch && allPassed ? 'DELETE + RESTORE PASS' : 'NOT YET PROVEN'}</strong>
          <small>Produktionsreife und kreative Freigaben bleiben ausgeschlossen.</small>
        </div>
      </section>

      <section className="loop-stations" aria-label="Produktionsloop-Stationen">
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
          <p className="eyebrow">KONTROLLIERTE AKTIONEN</p>
          <h2>Technischen Pfad Schritt für Schritt ausführen</h2>
          <div className="loop-actions">
            <button data-testid="loop-import" disabled={!state || stations.import === 'passed'} onClick={handleImport}>1 · Synthetisch importieren</button>
            <button data-testid="loop-review" disabled={!state || stations.import !== 'passed' || stations.review === 'passed'} onClick={handleReview}>2 · Technisch reviewen</button>
            <button data-testid="loop-qa" disabled={!state || stations.review !== 'passed' || stations.qa === 'passed'} onClick={handleQa}>3 · QA ausführen</button>
            <button data-testid="loop-letter" disabled={!state || stations.qa !== 'passed' || stations.lettering === 'passed'} onClick={handleLettering}>4 · Test-Lettering</button>
            <button data-testid="loop-package" disabled={!state || stations.lettering !== 'passed' || stations.package === 'passed'} onClick={handlePackage}>5 · Package erzeugen</button>
            <button data-testid="loop-delete" disabled={!state || stations.package !== 'passed'} onClick={handleDelete}>6 · Zustand löschen</button>
            <button data-testid="loop-restore" disabled={!deleted || !packageText} onClick={handleRestore}>7 · Package wiederherstellen</button>
            <button data-testid="loop-reset" className="ghost" onClick={handleReset}>Test zurücksetzen</button>
          </div>
          <p className="loop-message" data-testid="loop-message">{message}</p>
        </article>

        <article className="panel loop-boundary">
          <p className="eyebrow">HARTE GRENZEN</p>
          <h2>Was dieser Test niemals freigibt</h2>
          <ul>
            <li>kein Character- oder Location-Master</li>
            <li>keine Bild- oder GPU-Ausführung</li>
            <li>keine Stimme und kein finaler Dialog</li>
            <li>kein Production-Ready- oder Episodenclaim</li>
            <li>keine automatische Canon-Änderung</li>
          </ul>
          <p className="boundary">Der ausgewählte Pilot wird nur als Identitätsreferenz transportiert. Inhaltliche Detailfreigaben bleiben eigene Gates.</p>
        </article>
      </section>

      <section className="hash-grid" data-testid="loop-hashes">
        <article><span>PACKAGE SHA-256</span><code>{packageHash || 'noch nicht erzeugt'}</code></article>
        <article><span>STATE SHA-256 VOR LÖSCHUNG</span><code>{stateHash || 'noch nicht erzeugt'}</code></article>
        <article><span>STATE SHA-256 NACH RESTORE</span><code>{restoreHash || 'noch nicht wiederhergestellt'}</code></article>
        <article className={restoreMatch ? 'match' : ''}><span>GEGENPRÜFUNG</span><strong data-testid="restore-status">{restoreMatch ? 'HASH MATCH' : 'OFFEN'}</strong></article>
      </section>

      <details className="package-preview">
        <summary>EpisodePackage JSON anzeigen</summary>
        <textarea readOnly value={packageText} aria-label="EpisodePackage JSON" />
      </details>
    </main>
  );
}
