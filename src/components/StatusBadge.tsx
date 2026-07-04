import type { Status } from '../types';

const labels: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  generated: 'Generated',
  needs_fix: 'Needs Fix',
  approved: 'Approved',
  rejected: 'Rejected',
  assembled: 'Assembled',
  exported: 'Exported'
};

export function StatusBadge({ status }: { status: Status | string }) {
  return <span className={`status-badge status-${status}`}>{labels[status] ?? status}</span>;
}
