import { useEffect, useMemo, useState } from 'react';
import { Sidebar, navItems } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { StoryBible } from './pages/StoryBible';
import { Characters } from './pages/Characters';
import { Locations } from './pages/Locations';
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
      case '/story-bible':
        return <StoryBible />;
      case '/characters':
        return <Characters />;
      case '/locations':
        return <Locations />;
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
