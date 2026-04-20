'use client';

import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { bg: string; label: string }> = {
  created: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Created' },
  assigned: { bg: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Assigned' },
  accepted: { bg: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Accepted' },
  traveling: { bg: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Traveling' },
  on_site: { bg: 'bg-orange-100 text-orange-700 border-orange-200', label: 'On Site' },
  working: { bg: 'bg-violet-100 text-violet-700 border-violet-200', label: 'Working' },
  stuck: { bg: 'bg-amber-100 text-amber-700 border-amber-300', label: '⚠ Stuck' },
  completed: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Completed' },
  cancelled: { bg: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' },
};

const priorityConfig: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.created;
  return <Badge className={`text-[10px] font-medium ${config.bg}`}>{config.label}</Badge>;
}

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge className={`text-[10px] font-medium capitalize ${priorityConfig[priority] || priorityConfig.medium}`}>
      {priority}
    </Badge>
  );
}

interface SLARiskBadgeProps {
  risk: string;
}

export function SLARiskBadge({ risk }: SLARiskBadgeProps) {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  };
  return <Badge className={`text-[10px] ${colors[risk] || colors.low}`}>{risk}</Badge>;
}
