import { useEffect, useMemo, useState } from 'react';
import { Sidebar, navItems } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { PilotControlRoom } from './pages/PilotControlRoom';
import { WorkPacket } from './pages/WorkPacket';
import { WorkProgress } from './pages/WorkProgress';
import { WorkArchive } from './pages/WorkArchive';
import { NextShotBrief } from './pages/NextShotBrief';
import { ShotBriefPack } from './pages/ShotBriefPack';
import { PromptWorkbench } from './pages/PromptWorkbench';
import { FrameInbox } from './pages/FrameInbox';
import { FrameRegistry } from './pages/FrameRegistry';
import { FramePlan } from './pages/FramePlan';
import { FrameQaDecision } from './pages/FrameQaDecision';
import { FrameLifecycle } from './pages/FrameLifecycle';
import { EpisodeState } from './pages/EpisodeState';
import { EpisodeStateCheck } from './pages/EpisodeStateCheck';
import { CandidatePromotion } from './pages/CandidatePromotion';
import { StudioNext } from './pages/StudioNext';
import { PilotReady } from './pages/PilotReady';
import { MotionJobs } from './pages/MotionJobs';
import { CameraNotes } from './pages/CameraNotes';
import { PilotStep } from './pages/PilotStep';
import { StudioStatus } from './pages/StudioStatus';
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
import { AssetPreviewGallery } from './pages/AssetPreviewGallery';
import { ToolRadar } from './pages/ToolRadar';
import { RemotionAdapter } from './pages/RemotionAdapter';
import { ComfyAdapter } from './pages/ComfyAdapter';
import { ComfyRunner } from './pages/ComfyRunner';
import { AssetIntake } from './pages/AssetIntake';
import { PipelineStatus } from './pages/PipelineStatus';
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
      case '/pilot-control':
        return <PilotControlRoom />;
      case '/work-packet':
        return <WorkPacket />;
      case '/work-progress':
        return <WorkProgress />;
      case '/work-archive':
        return <WorkArchive />;
      case '/studio-next':
        return <StudioNext />;
      case '/studio-status':
        return <StudioStatus />;
      case '/episode-state':
        return <EpisodeState />;
      case '/episode-state-check':
        return <EpisodeStateCheck />;
      case '/next-shot':
        return <NextShotBrief />;
      case '/shot-briefs':
        return <ShotBriefPack />;
      case '/prompt-workbench':
        return <PromptWorkbench />;
      case '/frame-inbox':
      case '/keyframe-placement':
        return <FrameInbox />;
      case '/frame-registry':
        return <FrameRegistry />;
      case '/frame-plan':
        return <FramePlan />;
      case '/frame-qa-decision':
        return <FrameQaDecision />;
      case '/frame-lifecycle':
        return <FrameLifecycle />;
      case '/candidate-promotion':
        return <CandidatePromotion />;
      case '/pilot-ready':
        return <PilotReady />;
      case '/motion-jobs':
        return <MotionJobs />;
      case '/camera-notes':
        return <CameraNotes />;
      case '/pilot-step':
        return <PilotStep />;
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
      case '/asset-gallery':
        return <AssetPreviewGallery />;
      case '/tool-radar':
        return <ToolRadar />;
      case '/remotion-adapter':
        return <RemotionAdapter />;
      case '/comfy-adapter':
        return <ComfyAdapter />;
      case '/comfy-runner':
        return <ComfyRunner />;
      case '/asset-intake':
        return <AssetIntake />;
      case '/pipeline-status':
        return <PipelineStatus />;
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
