import { useEffect, useMemo, useState } from 'react';
import { Sidebar, navItems } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Characters } from './pages/Characters';
import { StyleBible } from './pages/StyleBible';
import { Episodes } from './pages/Episodes';
import { Storyboard } from './pages/Storyboard';
import { Generator } from './pages/Generator';
import { Review } from './pages/Review';
import { Export } from './pages/Export';

function getRoute() {
  return window.location.hash.replace('#', '') || '/';
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
      case '/characters':
        return <Characters />;
      case '/style-bible':
        return <StyleBible />;
      case '/episodes':
        return <Episodes />;
      case '/storyboard':
        return <Storyboard />;
      case '/generator':
        return <Generator />;
      case '/review':
        return <Review />;
      case '/export':
        return <Export />;
      default:
        return <Dashboard />;
    }
  }, [route]);

  return (
    <div className="app-shell">
      <Sidebar activeRoute={route} items={navItems} />
      <main className="main-content">
        <div className="topbar">
          <div>
            <p className="eyebrow">AI Comic Studio MVP</p>
            <h1>Comic Factory</h1>
          </div>
          <div className="topbar-pill">Mock Mode · No API Keys</div>
        </div>
        {Page}
      </main>
    </div>
  );
}
