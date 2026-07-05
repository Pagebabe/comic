import { useEffect, useMemo, useState } from 'react';
import { Sidebar, navItems } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { PilotControlRoom } from './pages/PilotControlRoom';
import { StudioStatus } from './pages/StudioStatus';
import { Review } from './pages/Review';
import { AssetPreviewGallery } from './pages/AssetPreviewGallery';
import { Episodes } from './pages/Episodes';
import { PanelFactory } from './pages/PanelFactory';
import { Characters } from './pages/Characters';
import { Locations } from './pages/Locations';
import { StyleBible } from './pages/StyleBible';
import { StoryBible } from './pages/StoryBible';
import { RiccoStudio } from './pages/RiccoStudio';
import { RiccoPromptQueue } from './pages/RiccoPromptQueue';
import { RiccoGenerationQueue } from './pages/RiccoGenerationQueue';
import { RiccoComfyM1 } from './pages/RiccoComfyM1';
import { RiccoReferencePacks } from './pages/RiccoReferencePacks';
import { RiccoAssetImport } from './pages/RiccoAssetImport';
import { RiccoBulkUpload } from './pages/RiccoBulkUpload';
import { RiccoImageReview } from './pages/RiccoImageReview';
import { RiccoStorage } from './pages/RiccoStorage';
import { RiccoExport } from './pages/RiccoExport';
import { RiccoLettering } from './pages/RiccoLettering';
import { RiccoPackage } from './pages/RiccoPackage';
import { RiccoRestore } from './pages/RiccoRestore';
import { RiccoQA } from './pages/RiccoQA';
import { RiccoControlRoom } from './pages/RiccoControlRoom';

function getRoute() {
  return window.location.hash.replace('#', '') || '/ricco-control';
}

function MissingRoute({ route }: { route: string }) {
  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Comic Factory Route</p>
        <h2>This route is not part of the lean online build yet.</h2>
        <p className="body-copy">The online version is focused on the Ricco production workflow and the existing Comic Factory control surface.</p>
        <div className="prompt-box">Current route: {route}</div>
        <div className="grid two-col">
          <a className="primary-button" href="#/ricco-control">Ricco Control</a>
          <a className="primary-button" href="#/ricco-reference-packs">Reference Packs</a>
          <a className="primary-button" href="#/ricco-asset-import">Asset Import</a>
          <a className="primary-button" href="#/ricco-image-review">Image Review</a>
          <a className="primary-button" href="#/ricco-storage">Storage</a>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const Page = useMemo(() => {
    switch (route) {
      case '/':
      case '/ricco-control':
        return <RiccoControlRoom />;
      case '/ricco-studio':
        return <RiccoStudio />;
      case '/ricco-prompt-queue':
        return <RiccoPromptQueue />;
      case '/ricco-generation-queue':
        return <RiccoGenerationQueue />;
      case '/ricco-comfy-m1':
        return <RiccoComfyM1 />;
      case '/ricco-reference-packs':
        return <RiccoReferencePacks />;
      case '/ricco-asset-import':
        return <RiccoAssetImport />;
      case '/ricco-bulk-upload':
        return <RiccoBulkUpload />;
      case '/ricco-image-review':
        return <RiccoImageReview />;
      case '/ricco-storage':
        return <RiccoStorage />;
      case '/ricco-export':
        return <RiccoExport />;
      case '/ricco-lettering':
        return <RiccoLettering />;
      case '/ricco-package':
        return <RiccoPackage />;
      case '/ricco-restore':
        return <RiccoRestore />;
      case '/ricco-qa':
        return <RiccoQA />;
      case '/studio-status':
        return <StudioStatus />;
      case '/pilot-control':
        return <PilotControlRoom />;
      case '/review':
        return <Review />;
      case '/asset-gallery':
        return <AssetPreviewGallery />;
      case '/episodes':
        return <Episodes />;
      case '/panel-factory':
        return <PanelFactory />;
      case '/characters':
        return <Characters />;
      case '/locations':
        return <Locations />;
      case '/style-bible':
        return <StyleBible />;
      case '/story-bible':
        return <StoryBible />;
      case '/dashboard':
        return <Dashboard />;
      default:
        return <MissingRoute route={route} />;
    }
  }, [route]);

  return (
    <div className="app-shell">
      <Sidebar activeRoute={route} items={navItems} />
      <main className="main-content">
        <div className="topbar">
          <div>
            <p className="eyebrow">Berlin Cartoon MVP</p>
            <h1>Ricco im Haus</h1>
          </div>
          <div className="topbar-pill">Comic Factory · Production Control</div>
        </div>
        {Page}
      </main>
    </div>
  );
}
