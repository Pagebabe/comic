import { Archive, BookOpen, Boxes, Captions, Clapperboard, FolderInput, FolderTree, Gauge, Images, Layers3, Map, PenTool, ShieldCheck, Upload, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavGroupName = 'Episode Flow' | 'Advanced Tools' | 'Old Pages';

export interface NavItem {
  route: string;
  label: string;
  icon: LucideIcon;
  group: NavGroupName;
  helper?: string;
}

export interface NavGroup {
  title: NavGroupName;
  helper: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'Episode Flow',
    helper: 'Use these in order to finish Episode 001.',
    items: [
      { route: '/ricco-control', label: 'Start', icon: Gauge, group: 'Episode Flow', helper: 'See the next best action.' },
      { route: '/ricco-studio', label: 'Episode Board', icon: Wand2, group: 'Episode Flow', helper: 'See all panels.' },
      { route: '/ricco-prompt-queue', label: 'Make Images', icon: FolderTree, group: 'Episode Flow', helper: 'Copy prompts for panel images.' },
      { route: '/ricco-comfy-m1', label: 'Render Helper', icon: Wand2, group: 'Episode Flow', helper: 'Prepare manual rendering.' },
      { route: '/ricco-bulk-upload', label: 'Upload Images', icon: Upload, group: 'Episode Flow', helper: 'Add many rendered files.' },
      { route: '/ricco-image-review', label: 'Choose Images', icon: ShieldCheck, group: 'Episode Flow', helper: 'Pick final panel images.' },
      { route: '/ricco-lettering', label: 'Add Text', icon: Captions, group: 'Episode Flow', helper: 'Place dialogue.' },
      { route: '/ricco-export', label: 'Export', icon: Upload, group: 'Episode Flow', helper: 'Create rough output.' },
      { route: '/ricco-package', label: 'Save Backup', icon: Archive, group: 'Episode Flow', helper: 'Save the episode state.' }
    ]
  },
  {
    title: 'Advanced Tools',
    helper: 'Useful later. You do not need these to finish the first rough episode.',
    items: [
      { route: '/ricco-workspace', label: 'Workspace Map', icon: FolderTree, group: 'Advanced Tools', helper: 'Full production map.' },
      { route: '/ricco-generation-queue', label: 'Generation Queue', icon: FolderTree, group: 'Advanced Tools', helper: 'Generated job list.' },
      { route: '/ricco-qa', label: 'QA Gate', icon: ShieldCheck, group: 'Advanced Tools', helper: 'Check output readiness.' },
      { route: '/ricco-storage', label: 'Storage Safety', icon: Archive, group: 'Advanced Tools', helper: 'Check browser storage.' },
      { route: '/ricco-restore', label: 'Restore Backup', icon: FolderInput, group: 'Advanced Tools', helper: 'Restore a saved package.' },
      { route: '/ricco-reference-packs', label: 'Reference Packs', icon: Layers3, group: 'Advanced Tools', helper: 'Prepare references.' },
      { route: '/ricco-reference-candidates', label: 'Reference Candidates', icon: Layers3, group: 'Advanced Tools', helper: 'Review possible references.' },
      { route: '/ricco-asset-import', label: 'Asset Import', icon: Images, group: 'Advanced Tools', helper: 'Import public assets.' },
      { route: '/ricco-assets', label: 'Asset Library', icon: Images, group: 'Advanced Tools', helper: 'Manage all assets.' },
      { route: '/ricco-fix-queue', label: 'Fix Queue', icon: ShieldCheck, group: 'Advanced Tools', helper: 'Repair weak images.' },
      { route: '/ricco-dataset-candidates', label: 'Dataset Candidates', icon: Layers3, group: 'Advanced Tools', helper: 'Prepare future training data.' },
      { route: '/ricco-approved-dataset', label: 'Approved Dataset', icon: Layers3, group: 'Advanced Tools', helper: 'Export approved training data.' },
      { route: '/ricco-lora-training-plan', label: 'LoRA Training Plan', icon: Layers3, group: 'Advanced Tools', helper: 'Plan future consistency training.' }
    ]
  },
  {
    title: 'Old Pages',
    helper: 'Older screens kept for reference. Not part of the beginner episode flow.',
    items: [
      { route: '/dashboard', label: 'Old Dashboard', icon: Gauge, group: 'Old Pages' },
      { route: '/story-bible', label: 'Story Bible', icon: BookOpen, group: 'Old Pages' },
      { route: '/style-bible', label: 'Style Bible', icon: PenTool, group: 'Old Pages' },
      { route: '/characters', label: 'Characters', icon: Boxes, group: 'Old Pages' },
      { route: '/locations', label: 'Locations', icon: Map, group: 'Old Pages' },
      { route: '/episodes', label: 'Episodes', icon: Clapperboard, group: 'Old Pages' },
      { route: '/panel-factory', label: 'Panel Factory', icon: FolderTree, group: 'Old Pages' },
      { route: '/review', label: 'Old Review', icon: ShieldCheck, group: 'Old Pages' },
      { route: '/asset-gallery', label: 'Asset Gallery', icon: Images, group: 'Old Pages' }
    ]
  }
];

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

export function Sidebar({ activeRoute, items }: { activeRoute: string; items: NavItem[] }) {
  const groupedItems = navGroups
    .map((group) => ({
      ...group,
      items: items.filter((item) => item.group === group.title)
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">RIH</div>
        <div>
          <strong>Ricco im Haus</strong>
          <span>Guided Comic Factory</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Comic Factory guided navigation">
        {groupedItems.map((group) => (
          <div className="nav-group" key={group.title}>
            <span className="nav-group-title">{group.title}</span>
            <span className="nav-group-helper">{group.helper}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.route} className={activeRoute === item.route ? 'active' : ''} href={`#${item.route}`} title={item.helper}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-note">
        <strong>Next:</strong> Finish Episode 001. Start with images, choose finals, add text, export, then save backup.
      </div>
    </aside>
  );
}
