'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Zap, MapPin, Clock, User, CheckCircle2, AlertTriangle, Map, List, Navigation } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/workorders/WorkOrderStatusBadge';
import { toast } from 'sonner';
import { entities } from '@/lib/entity-client';
import type { WorkOrder, Technician } from '@ffm/shared';

const GISMapView = dynamic(() => import('@/components/map/GISMapView'), { ssr: false });

function haversine(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ScoredTech extends Technician {
  score: number;
}

export default function Dispatch() {
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'active' | 'gis'>('queue');
  const queryClient = useQueryClient();

  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ['workOrders'],
    queryFn: () => entities.WorkOrder.list('-created_date', 200),
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ['technicians'],
    queryFn: () => entities.Technician.list('-created_date', 200),
  });

  const unassigned = workOrders.filter((wo) => wo.status === 'created');
  const active = workOrders.filter((wo) => ['assigned', 'accepted', 'traveling', 'on_site', 'working'].includes(wo.status as string));
  const gisVisible = workOrders.filter((wo) => wo.site_latitude && wo.site_longitude);

  const calculateScore = (tech: Technician, wo: WorkOrder): number => {
    const distance = Math.abs((tech.home_latitude || 0) - (wo.site_latitude || 0)) + Math.abs((tech.home_longitude || 0) - (wo.site_longitude || 0));
    const distanceScore = Math.min(distance * 10, 100);
    const loadScore = ((tech.current_daily_jobs || 0) / (tech.max_daily_jobs || 6)) * 100;
    const slaRiskScore = wo.sla_risk === 'high' ? 100 : wo.sla_risk === 'medium' ? 50 : 0;
    const skillMatch = (wo.required_skills?.length ?? 0) > 0
      ? (wo.required_skills!.filter((s) => tech.skills?.includes(s)).length / wo.required_skills!.length) * 100
      : 100;
    return (distanceScore * 0.35) + (loadScore * 0.25) + (slaRiskScore * 0.2) + ((100 - skillMatch) * 0.2);
  };

  const getCandidates = (wo: WorkOrder): ScoredTech[] => {
    return technicians
      .filter((t) => t.status === 'active' && t.availability !== 'offline')
      .filter((t) => !wo.zone_name || t.zone_name === wo.zone_name || !t.zone_name)
      .filter((t) => (t.current_daily_jobs || 0) < (t.max_daily_jobs || 6))
      .map((t) => ({ ...t, score: calculateScore(t, wo) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);
  };

  const handleAutoDispatch = async (wo: WorkOrder) => {
    setDispatching(wo.id);
    const candidates = getCandidates(wo);
    if (candidates.length === 0) {
      toast.error('No available technicians for this job');
      setDispatching(null);
      return;
    }
    const best = candidates[0];
    await entities.WorkOrder.update(wo.id, {
      assigned_technician_id: best.id,
      assigned_technician_name: best.full_name,
      status: 'assigned',
      dispatch_score: best.score,
      sla_risk: wo.sla_risk || 'low',
    } as Partial<WorkOrder>);
    await entities.Technician.update(best.id, { current_daily_jobs: (best.current_daily_jobs || 0) + 1 } as Partial<Technician>);
    toast.success(`Assigned to ${best.full_name}`);
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
    setDispatching(null);
  };

  const handleManualAssign = async (wo: WorkOrder, techId: string) => {
    const tech = technicians.find((t) => t.id === techId);
    if (!tech) return;
    await entities.WorkOrder.update(wo.id, {
      assigned_technician_id: tech.id,
      assigned_technician_name: tech.full_name,
      status: 'assigned',
    } as Partial<WorkOrder>);
    await entities.Technician.update(tech.id, { current_daily_jobs: (tech.current_daily_jobs || 0) + 1 } as Partial<Technician>);
    toast.success(`Manually assigned to ${tech.full_name}`);
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
  };

  const handleBulkDispatch = async () => {
    setDispatching('bulk');
    for (const wo of unassigned) {
      const candidates = getCandidates(wo);
      if (candidates.length > 0) {
        const best = candidates[0];
        await entities.WorkOrder.update(wo.id, {
          assigned_technician_id: best.id,
          assigned_technician_name: best.full_name,
          status: 'assigned',
          dispatch_score: best.score,
        } as Partial<WorkOrder>);
      }
    }
    toast.success('Bulk dispatch completed');
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
    setDispatching(null);
  };

  const techRows = useMemo(() => {
    const woMap: Record<string, WorkOrder> = {};
    workOrders.forEach((wo) => {
      if (wo.assigned_technician_id && ['traveling', 'on_site', 'working', 'assigned', 'accepted'].includes(wo.status as string)) {
        woMap[wo.assigned_technician_id] = wo;
      }
    });
    return technicians
      .filter((t) => (t.current_latitude || t.home_latitude) && (t.current_longitude || t.home_longitude))
      .map((t) => {
        const wo = woMap[t.id];
        const tLat = t.current_latitude || t.home_latitude;
        const tLng = t.current_longitude || t.home_longitude;
        const dist = wo ? haversine(tLat, tLng, wo.site_latitude, wo.site_longitude) : null;
        const etaMins = dist ? Math.round((dist / 40) * 60) : null;
        return { tech: t, wo, dist, etaMins };
      });
  }, [technicians, workOrders]);

  const tabs = [
    { key: 'queue' as const, label: `Queue (${unassigned.length})`, icon: AlertTriangle },
    { key: 'active' as const, label: `Active (${active.length})`, icon: List },
    { key: 'gis' as const, label: 'GIS Map', icon: Map },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center bg-white">
          <p className="text-2xl font-bold text-slate-900">{unassigned.length}</p>
          <p className="text-xs text-slate-500">Unassigned Jobs</p>
        </Card>
        <Card className="p-4 text-center bg-white">
          <p className="text-2xl font-bold text-blue-600">{active.length}</p>
          <p className="text-xs text-slate-500">Active Jobs</p>
        </Card>
        <Card className="p-4 text-center bg-white">
          <p className="text-2xl font-bold text-emerald-600">{technicians.filter((t) => t.availability === 'available').length}</p>
          <p className="text-xs text-slate-500">Available Techs</p>
        </Card>
        <Card className="p-4">
          <Button className="w-full" disabled={unassigned.length === 0 || dispatching === 'bulk'} onClick={handleBulkDispatch}>
            {dispatching === 'bulk' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Auto-Dispatch All
          </Button>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div>
          {unassigned.length === 0 ? (
            <Card className="p-8 text-center bg-white">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All jobs have been dispatched</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {unassigned.map((wo) => {
                const candidates = getCandidates(wo);
                return (
                  <Card key={wo.id} className="p-4 bg-white border-slate-200/80">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-500">{wo.order_number}</span>
                          <PriorityBadge priority={wo.priority as string} />
                          <Badge variant="outline" className="text-[10px] capitalize">{(wo.service_type as string)?.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-800 mt-1 truncate">{wo.title}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                          {wo.zone_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{wo.zone_name}</span>}
                          {wo.customer_name && <span>{wo.customer_name}</span>}
                          {wo.estimated_duration_hrs && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{wo.estimated_duration_hrs}h</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select onValueChange={(techId) => handleManualAssign(wo, techId)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Manual assign..." />
                          </SelectTrigger>
                          <SelectContent>
                            {candidates.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                <span>{c.full_name}</span>
                                <span className="text-[10px] text-slate-400 ml-1">({Math.round(c.score)})</span>
                              </SelectItem>
                            ))}
                            {candidates.length === 0 && <SelectItem value="none" disabled>No candidates</SelectItem>}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => handleAutoDispatch(wo)} disabled={dispatching === wo.id}>
                          {dispatching === wo.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-3.5 h-3.5 mr-1" /> Auto</>}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active Tab */}
      {activeTab === 'active' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {active.map((wo) => (
            <Card key={wo.id} className="p-3 bg-white border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-slate-500">{wo.order_number}</span>
                <StatusBadge status={wo.status as string} />
              </div>
              <p className="text-sm font-medium text-slate-800 truncate">{wo.title}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                <User className="w-3 h-3" />
                <span>{wo.assigned_technician_name || 'Unassigned'}</span>
              </div>
            </Card>
          ))}
          {active.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">No active jobs</div>
          )}
        </div>
      )}

      {/* GIS Tab */}
      {activeTab === 'gis' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Map */}
          <div className="xl:col-span-3" style={{ height: 560 }}>
            <GISMapView workOrders={gisVisible} technicians={technicians} />
          </div>

          {/* Sidebar */}
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 560 }}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Technician Status</p>
            {techRows.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
                No technicians with location data
              </div>
            )}
            {techRows.map(({ tech, wo, dist, etaMins }) => {
              const avColor = tech.availability === 'available' ? 'bg-emerald-100 text-emerald-700' : tech.availability === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500';
              return (
                <Card key={tech.id} className="p-3 bg-white border-slate-200/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{tech.full_name}</p>
                      <p className="text-xs text-slate-400">{tech.zone_name || '—'}</p>
                    </div>
                    <Badge className={`text-[9px] shrink-0 ${avColor}`}>{tech.availability}</Badge>
                  </div>
                  {wo ? (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                      <p className="text-xs text-blue-600 font-medium truncate">→ {wo.title}</p>
                      <div className="flex gap-3">
                        {dist !== null && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Navigation className="w-3 h-3 text-blue-400" />
                            {dist.toFixed(1)} km
                          </span>
                        )}
                        {etaMins !== null && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3 text-amber-400" />
                            ~{etaMins < 60 ? `${etaMins} min` : `${(etaMins / 60).toFixed(1)} hr`}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs text-emerald-500">No active assignment</p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
