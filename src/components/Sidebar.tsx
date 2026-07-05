import { BookOpen, Boxes, Clapperboard, FolderTree, Gauge, Images, Map, PenTool, ShieldCheck, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  route: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { route: '/ricco-studio', label: 'Ricco Studio', icon: Wand2 },
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
        <strong>Rule:</strong> Story first. Clean comic frames second. Text, voice and export only after panel review.
      </div>
    </aside>
  );
}
