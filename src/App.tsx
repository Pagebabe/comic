import { useEffect, useMemo, useState } from 'react';
import { Sidebar, navItems } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { StoryBible } from './pages/StoryBible';
import { Characters } from './pages/Characters';
import { Locations } from './pages/Locations';
import { StyleBible } from './pages/StyleBible';
import { Episodes } from './pages/Episodes';
import { EpisodeBuilder } from './pages/EpisodeBuilder';
import { Storyboard } from './pages/Storyboard';
import { TvEpisodePlan } from './pages/TvEpisodePlan';
import { PanelFactory } from './pages/PanelFactory';
import { Generator } from './pages/Generator';
import { KeyframeJobs } from './pages/KeyframeJobs';
import { TvReviewQueue } from './pages/TvReviewQueue';
import { FixQueue } from './pages/FixQueue';
import { Renderers } from './pages/Renderers';
import { VoiceSubtitles } from './pages/VoiceSubtitles';
import { Review } from './pages/Review';
import { Jobs } from './pages/Jobs';
import { OutputStructure } from './pages/OutputStructure';
import { AssemblyPlan } from './pages/AssemblyPlan';
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
      case '/episode-builder':
        return <EpisodeBuilder />;
      case '/storyboard':
        return <Storyboard />;
      case '/tv-episode':
        return <TvEpisodePlan />;
      case '/panel-factory':
        return <PanelFactory />;
      case '/generator':
        return <Generator />;
      case '/keyframe-jobs':
        return <KeyframeJobs />;
      case '/tv-review':
        return <TvReviewQueue />;
      case '/fix-queue':
        return <FixQueue />;
      case '/renderers':
        return <Renderers />;
      case '/voice-subtitles':
        return <VoiceSubtitles />;
      case '/review':
        return <Review />;
      case '/jobs':
        return <Jobs />;
      case '/outputs':
        return <OutputStructure />;
      case '/assembly':
        return <AssemblyPlan />;
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
