'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Pencil, Trash2, ListChecks, ChevronRight, Clock, AlertTriangle, CheckCircle2, Zap, Users, RefreshCw, AlertOctagon } from 'lucide-react';
import { StatusBadge } from '@/components/workorders/WorkOrderStatusBadge';
import WorkOrderForm from '@/components/workorders/WorkOrderForm';
import WorkOrderStepForm from '@/components/workorders/WorkOrderStepForm';
import StuckDialog from '@/components/workorders/StuckDialog';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';
import { entities } from '@/lib/entity-client';
import type { WorkOrder, ServiceType } from '@ffm/shared';

const STATUS_FLOW = ['created', 'assigned', 'accepted', 'traveling', 'on_site', 'working', 'stuck', 'completed', 'cancelled'] as const;

const STATUS_META: Record<string, { label: string; color: string }> = {
  created:   { label: 'Created',   color: 'bg-slate-100 text-slate-600 border-slate-200' },
  assigned:  { label: 'Assigned',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  accepted:  { label: 'Accepted',  color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  traveling: { label: 'Traveling', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  on_site:   { label: 'On Site',   color: 'bg-orange-100 text-orange-700 border-orange-200' },
  working:   { label: 'Working',   color: 'bg-purple-100 text-purple-700 border-purple-200' },
  stuck:     { label: 'Stuck',     color: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600 border-red-200' },
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
  active: boolean;
}

function StatCard({ label, value, icon: Icon, color, onClick, active }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left w-full ${active ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <div className="text-xl font-bold text-slate-800 leading-none">{value}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
      </div>
    </button>
  );
}

export default function WorkOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<WorkOrder | null>(null);
  const [stepFormWO, setStepFormWO] = useState<WorkOrder | null>(null);
  const [stuckWO, setStuckWO] = useState<WorkOrder | null>(null);
  const [savingStuck, setSavingStuck] = useState(false);
  const queryClient = useQueryClient();

  const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
    queryKey: ['serviceTypes'],
    queryFn: () => entities.ServiceType.filter({ is_active: true }, 'name', 500),
  });

  const { data: workOrders = [], isLoading, refetch } = useQuery<WorkOrder[]>({
    queryKey: ['workOrders'],
    queryFn: () => entities.WorkOrder.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const filtered = workOrders.filter((wo) => {
    const matchSearch = !search || wo.title?.toLowerCase().includes(search.toLowerCase()) || wo.order_number?.toLowerCase().includes(search.toLowerCase()) || wo.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || wo.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    await entities.WorkOrder.delete(id);
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
  };

  const handleStatusChange = async (wo: WorkOrder, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'working') updates.started_at = new Date().toISOString();
    if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
    await entities.WorkOrder.update(wo.id, updates as Partial<WorkOrder>);
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
  };

  const nextStatus = (current: string): string | null => {
    if (current === 'stuck') return 'working';
    const idx = STATUS_FLOW.indexOf(current as typeof STATUS_FLOW[number]);
    if (idx === -1 || idx >= STATUS_FLOW.indexOf('completed')) return null;
    const next = STATUS_FLOW[idx + 1];
    if (next === 'stuck') return null;
    return next;
  };

  const handleMarkStuck = async (wo: WorkOrder, extras: Record<string, unknown>) => {
    setSavingStuck(true);
    await entities.WorkOrder.update(wo.id, { status: 'stuck', ...extras } as Partial<WorkOrder>);
    setSavingStuck(false);
    setStuckWO(null);
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
  };

  const active = workOrders.filter((w) => !['completed', 'cancelled'].includes(w.status as string));
  const slaHigh = workOrders.filter((w) => w.sla_risk === 'high' && w.status !== 'completed');
  const inProgress = workOrders.filter((w) => ['traveling', 'on_site', 'working'].includes(w.status as string));
  const stuckCount = workOrders.filter((w) => w.status === 'stuck');
  const todayCompleted = workOrders.filter((w) => w.status === 'completed' && moment(w.completed_at).isSame(moment(), 'day'));

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-5">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatCard label="Active Jobs" value={active.length} icon={Zap} color="bg-blue-500" onClick={() => setStatusFilter('all')} active={statusFilter === 'all'} />
        <StatCard label="In Progress" value={inProgress.length} icon={Users} color="bg-purple-500" onClick={() => setStatusFilter('working')} active={statusFilter === 'working'} />
        <StatCard label="Stuck" value={stuckCount.length} icon={AlertOctagon} color="bg-amber-500" onClick={() => setStatusFilter('stuck')} active={statusFilter === 'stuck'} />
        <StatCard label="SLA at Risk" value={slaHigh.length} icon={AlertTriangle} color="bg-red-500" onClick={() => setStatusFilter('all')} active={false} />
        <StatCard label="Done Today" value={todayCompleted.length} icon={CheckCircle2} color="bg-green-500" onClick={() => setStatusFilter('completed')} active={statusFilter === 'completed'} />
      </div>

      {/* Status Quick Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${statusFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
        >
          All ({workOrders.length})
        </button>
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const count = workOrders.filter((w) => w.status === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${statusFilter === key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search order, title, customer..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setEditData(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Work Order
          </Button>
        </div>
      </div>

      {/* Work Order Cards */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No work orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((wo) => {
            const st = serviceTypes.find((s) => s.code === wo.service_type || s.name === wo.service_type);
            const hasSteps = (st?.steps?.length ?? 0) > 0;
            const next = nextStatus(wo.status as string);
            const isUrgent = wo.sla_risk === 'high';

            const isStuck = wo.status === 'stuck';
            return (
              <Card key={wo.id} className={`p-3 hover:shadow-md transition-all border-l-4 ${isStuck ? 'border-l-amber-400' : isUrgent ? 'border-l-red-400' : 'border-l-transparent'}`}>
                <div className="flex items-center gap-3">
                  {/* Priority dot */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${PRIORITY_COLOR[wo.priority as string] || 'bg-slate-300'}`} title={wo.priority as string} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-400">{wo.order_number}</span>
                      <span className="font-semibold text-sm text-slate-800 truncate">{wo.title}</span>
                      {isStuck && <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium"><AlertOctagon className="w-3 h-3" /> {wo.stuck_reason_name || 'Stuck'}</span>}
                      {isUrgent && !isStuck && <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-medium"><AlertTriangle className="w-3 h-3" /> SLA Risk</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {wo.customer_name && <span className="text-xs text-slate-500">{wo.customer_name}</span>}
                      {wo.assigned_technician_name && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {wo.assigned_technician_name}
                        </span>
                      )}
                      {wo.scheduled_date && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {moment(wo.scheduled_date).format('D MMM YYYY')}
                          {wo.scheduled_time && ` ${wo.scheduled_time}`}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 capitalize">{(wo.service_type as string)?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="hidden sm:block">
                    <StatusBadge status={wo.status as string} />
                  </div>

                  {/* Steps Button */}
                  {hasSteps && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5 text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => setStepFormWO(wo)}
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Steps</span>
                    </Button>
                  )}

                  {/* Stuck Button */}
                  {!['completed', 'cancelled', 'stuck'].includes(wo.status as string) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1 text-xs h-8 border-amber-300 text-amber-600 hover:bg-amber-50"
                      onClick={() => setStuckWO(wo)}
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Stuck</span>
                    </Button>
                  )}

                  {/* Next Status Button */}
                  {next && (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`shrink-0 gap-1 text-xs h-8 ${isStuck ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : ''}`}
                      onClick={() => handleStatusChange(wo, next)}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span className="hidden md:inline capitalize">{isStuck ? 'Resume' : STATUS_META[next]?.label}</span>
                    </Button>
                  )}

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditData(wo); setShowForm(true); }}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStepFormWO(wo)}>
                        <ListChecks className="w-3.5 h-3.5 mr-2" /> กรอก Steps
                      </DropdownMenuItem>
                      {!['completed', 'cancelled', 'stuck'].includes(wo.status as string) && (
                        <DropdownMenuItem onClick={() => setStuckWO(wo)} className="text-amber-600">
                          <AlertOctagon className="w-3.5 h-3.5 mr-2" /> Mark as Stuck
                        </DropdownMenuItem>
                      )}
                      {STATUS_FLOW.filter((s) => s !== wo.status && s !== 'cancelled' && s !== 'stuck').map((s) => (
                        <DropdownMenuItem key={s} onClick={() => handleStatusChange(wo, s)}>
                          → {STATUS_META[s]?.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onClick={() => handleDelete(wo.id)} className="text-red-600">
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <WorkOrderForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['workOrders'] }); }}
          editData={editData}
        />
      )}

      <StuckDialog
        open={!!stuckWO}
        onClose={() => setStuckWO(null)}
        onConfirm={(extras: Record<string, unknown>) => stuckWO && handleMarkStuck(stuckWO, extras)}
        saving={savingStuck}
      />

      {stepFormWO && (() => {
        const st = serviceTypes.find((s) => s.code === stepFormWO.service_type || s.name === stepFormWO.service_type);
        return (
          <WorkOrderStepForm
            open={!!stepFormWO}
            onClose={() => setStepFormWO(null)}
            workOrder={stepFormWO}
            serviceType={st}
          />
        );
      })()}
    </div>
  );
}
