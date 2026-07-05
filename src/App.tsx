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

function getRoute() {
  return window.location.hash.replace('#', '') || '/studio-status';
}

function MissingRoute({ route }: { route: string }) {
  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Online Studio Route</p>
        <h2>This route is not part of the lean online build yet.</h2>
        <p className="body-copy">The online version is focused on the core Comic Factory control surface. Use the buttons below.</p>
        <div className="prompt-box">Current route: {route}</div>
        <div className="grid two-col">
          <a className="primary-button" href="#/studio-status">Studio Status</a>
          <a className="primary-button" href="#/pilot-control">Pilot Control</a>
          <a className="primary-button" href="#/review">Review Room</a>
          <a className="primary-button" href="#/asset-gallery">Asset Gallery</a>
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
            <p className="eyebrow">Free-for-All Berlin Absurd Cartoon MVP</p>
            <h1>Rico gegen Berlin</h1>
          </div>
          <div className="topbar-pill">Comic Video · Clean Frames</div>
        </div>
        {Page}
      </main>
    </div>
  );
}
