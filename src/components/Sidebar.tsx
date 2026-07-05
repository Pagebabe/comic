import { Archive, BookOpen, Boxes, Captions, Clapperboard, FolderInput, FolderTree, Gauge, Images, Layers3, Map, PenTool, ShieldCheck, Upload, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  route: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { route: '/ricco-control', label: 'Ricco Control', icon: Gauge },
  { route: '/ricco-workspace', label: 'Workspace Map', icon: FolderTree },
  { route: '/ricco-studio', label: 'Ricco Studio', icon: Wand2 },
  { route: '/ricco-prompt-queue', label: 'Prompt Queue', icon: FolderTree },
  { route: '/ricco-generation-queue', label: 'Generation Queue', icon: FolderTree },
  { route: '/ricco-comfy-m1', label: 'ComfyUI M1', icon: Wand2 },
  { route: '/ricco-reference-packs', label: 'Reference Packs', icon: Layers3 },
  { route: '/ricco-reference-candidates', label: 'Reference Candidates', icon: Layers3 },
  { route: '/ricco-asset-import', label: 'Asset Import', icon: Images },
  { route: '/ricco-assets', label: 'Asset Library', icon: Images },
  { route: '/ricco-fix-queue', label: 'Fix Queue', icon: ShieldCheck },
  { route: '/ricco-bulk-upload', label: 'Bulk Upload', icon: Upload },
  { route: '/ricco-image-review', label: 'Ricco Image Review', icon: ShieldCheck },
  { route: '/ricco-storage', label: 'Ricco Storage', icon: Archive },
  { route: '/ricco-qa', label: 'Ricco Gate', icon: ShieldCheck },
  { route: '/ricco-export', label: 'Ricco Export', icon: Upload },
  { route: '/ricco-lettering', label: 'Ricco Lettering', icon: Captions },
  { route: '/ricco-package', label: 'Ricco Package', icon: Archive },
  { route: '/ricco-restore', label: 'Ricco Restore', icon: FolderInput },
  { route: '/dashboard', label: 'Dashboard', icon: Gauge },
  { route: '/story-bible', label: 'Story Bible', icon: BookOpen },
  { route: '/style-bible', label: 'Style Bible', icon: PenTool },
  { route: '/characters', label: 'Characters', icon: Boxes },
  { route: '/locations', label: 'Locations', icon: Map },
  { route: '/episodes', label: 'Episodes', icon: Clapperboard },
  { route: '/panel-factory', label: 'Panel Factory', icon: FolderTree },
  { route: '/review', label: 'Review', icon: ShieldCheck },
  { route: '/asset-gallery', label: 'Asset Gallery', icon: Images }
];

export function Sidebar({ activeRoute, items }: { activeRoute: string; items: NavItem[] }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">RIH</div>
        <div>
          <strong>Ricco im Haus</strong>
          <span>Comic Factory</span>
        </div>
      </div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.route} className={activeRoute === item.route ? 'active' : ''} href={`#${item.route}`}>
              <Icon size={18} />
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="sidebar-note">
        <strong>Workflow:</strong> Story first. Clean comic frames second. Text and export only after panel review.
      </div>
    </aside>
  );
}
