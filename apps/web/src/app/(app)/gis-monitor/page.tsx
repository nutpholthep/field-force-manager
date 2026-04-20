'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  RefreshCw,
  Search,
  Users,
  ClipboardList,
  Radio,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { entities } from '@/lib/entity-client';
import type { Technician, WorkOrder, Zone } from '@ffm/shared';

const GISMapView = dynamic(() => import('@/components/map/GISMapView'), { ssr: false });

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: 'ว่าง', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  busy: { label: 'มีงาน', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  offline: { label: 'ออฟไลน์', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  break: { label: 'พัก', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
};

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-slate-100 text-slate-600',
  assigned: 'bg-blue-100 text-blue-700',
  accepted: 'bg-violet-100 text-violet-700',
  traveling: 'bg-amber-100 text-amber-700',
  on_site: 'bg-emerald-100 text-emerald-700',
  working: 'bg-teal-100 text-teal-700',
  stuck: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-rose-100 text-rose-500',
};

const STATUS_LABELS: Record<string, string> = {
  created: 'สร้างแล้ว',
  assigned: 'มอบหมาย',
  accepted: 'รับงาน',
  traveling: 'กำลังเดินทาง',
  on_site: 'ถึงไซต์',
  working: 'กำลังทำงาน',
  stuck: 'ติดขัด',
  completed: 'เสร็จแล้ว',
  cancelled: 'ยกเลิก',
};

const AUTO_REFRESH_INTERVAL = 30000;

interface FocusTarget {
  lat: number;
  lng: number;
  zoom: number;
}

export default function GISMonitor() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'technicians' | 'workorders'>('technicians');
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  const fetchData = useCallback(async () => {
    const [techs, wos, zns] = await Promise.all([
      entities.Technician.list('-updated_date', 200),
      entities.WorkOrder.filter({ status: ['assigned', 'accepted', 'traveling', 'on_site', 'working', 'stuck'] }, '-updated_date', 300),
      entities.Zone.list(),
    ]);
    setTechnicians(techs || []);
    setWorkOrders(wos || []);
    setZones(zns || []);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const filteredTechs = technicians.filter((t) => {
    const matchSearch = !search || t.full_name?.toLowerCase().includes(search.toLowerCase()) || t.technician_code?.toLowerCase().includes(search.toLowerCase());
    const matchAv = filterAvailability === 'all' || t.availability === filterAvailability;
    const matchZone = filterZone === 'all' || t.zone_id === filterZone;
    return matchSearch && matchAv && matchZone;
  });

  const filteredWOs = workOrders.filter((wo) => {
    const matchSearch = !search || wo.title?.toLowerCase().includes(search.toLowerCase()) || wo.order_number?.toLowerCase().includes(search.toLowerCase()) || wo.assigned_technician_name?.toLowerCase().includes(search.toLowerCase());
    const matchZone = filterZone === 'all' || zones.find((z) => z.name === wo.zone_name)?.id === filterZone;
    return matchSearch && matchZone;
  });

  const stats = {
    total: technicians.filter((t) => t.status === 'active').length,
    available: technicians.filter((t) => t.availability === 'available' && t.status === 'active').length,
    busy: technicians.filter((t) => t.availability === 'busy').length,
    activeWOs: workOrders.length,
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-900" style={{ minHeight: 0 }}>
      {/* Sidebar */}
      <div className={`flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300 ${sidebarOpen ? 'w-[320px] min-w-[320px]' : 'w-0 min-w-0 overflow-hidden'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-white font-semibold text-sm">GIS Monitor</span>
            <div className="ml-auto flex items-center gap-1.5">
              {autoRefresh ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Wifi className="w-3 h-3" /> Live</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-slate-500"><WifiOff className="w-3 h-3" /> Paused</span>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { label: 'ช่างทั้งหมด', value: stats.total, color: 'text-white' },
              { label: 'ว่าง', value: stats.available, color: 'text-emerald-400' },
              { label: 'มีงาน', value: stats.busy, color: 'text-amber-400' },
              { label: 'งานActive', value: stats.activeWOs, color: 'text-blue-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-700/60 rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาช่าง / งาน..."
              className="pl-8 h-8 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="flex-1 h-7 text-xs bg-slate-700 border border-slate-600 text-slate-200 rounded-md px-2"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="available">ว่าง</option>
              <option value="busy">มีงาน</option>
              <option value="offline">ออฟไลน์</option>
              <option value="break">พัก</option>
            </select>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="flex-1 h-7 text-xs bg-slate-700 border border-slate-600 text-slate-200 rounded-md px-2"
            >
              <option value="all">ทุกโซน</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { key: 'technicians' as const, label: 'ช่าง', icon: Users, count: filteredTechs.length },
            { key: 'workorders' as const, label: 'งาน', icon: ClipboardList, count: filteredWOs.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${activeTab === tab.key ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-600 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-sm">กำลังโหลด...</div>
          ) : activeTab === 'technicians' ? (
            filteredTechs.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-10">ไม่พบช่าง</div>
            ) : (
              filteredTechs.map((tech) => {
                const av = AVAILABILITY_CONFIG[tech.availability as string] || AVAILABILITY_CONFIG.offline;
                const assignedWO = workOrders.find((wo) => wo.assigned_technician_id === tech.id && ['assigned', 'accepted', 'traveling', 'on_site', 'working'].includes(wo.status as string));
                const isSelected = selectedTechId === tech.id;
                return (
                  <button
                    key={tech.id}
                    onClick={() => {
                      const next = isSelected ? null : tech.id;
                      setSelectedTechId(next);
                      const lat = tech.current_latitude || tech.home_latitude;
                      const lng = tech.current_longitude || tech.home_longitude;
                      if (next && lat && lng) setFocusTarget({ lat, lng, zoom: 15 });
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/40 transition-colors ${isSelected ? 'bg-blue-500/10 border-l-2 border-l-blue-400' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold text-slate-200">
                          {tech.full_name?.[0] || '?'}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-800 ${av.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs font-semibold truncate">{tech.full_name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${av.color}`}>{av.label}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-500" />
                          <span className="text-slate-400 text-[10px] truncate">{tech.zone_name || 'ไม่มีโซน'}</span>
                        </div>
                        {assignedWO && (
                          <div className="mt-1 bg-slate-700/60 rounded px-2 py-1">
                            <span className="text-[10px] text-amber-300 truncate block">📋 {assignedWO.title}</span>
                            <span className={`text-[9px] px-1 py-0.5 rounded ${STATUS_COLORS[assignedWO.status as string] || ''}`}>{STATUS_LABELS[assignedWO.status as string] || assignedWO.status}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            filteredWOs.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-10">ไม่พบงาน Active</div>
            ) : (
              filteredWOs.map((wo) => (
                <button
                  key={wo.id}
                  onClick={() => {
                    if (wo.site_latitude && wo.site_longitude) {
                      setFocusTarget({ lat: wo.site_latitude, lng: wo.site_longitude, zoom: 15 });
                    }
                  }}
                  className="w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono text-slate-400">{wo.order_number}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[wo.status as string] || ''}`}>{STATUS_LABELS[wo.status as string] || wo.status}</span>
                      </div>
                      <p className="text-white text-xs font-medium truncate">{wo.title}</p>
                      <p className="text-slate-400 text-[10px] truncate mt-0.5">{wo.customer_name}</p>
                      {wo.assigned_technician_name && (
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-2.5 h-2.5 text-blue-400" />
                          <span className="text-blue-300 text-[10px]">{wo.assigned_technician_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Clock className="w-3 h-3" />
            <span>อัปเดต: {formatTime(lastRefresh)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAutoRefresh((v) => !v)}
              className={`h-6 px-2 text-[10px] ${autoRefresh ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Radio className="w-3 h-3 mr-1" />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchData}
              className="h-6 px-2 text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <div className="relative flex-shrink-0 flex">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute top-1/2 -translate-y-1/2 -right-5 z-20 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-r-lg p-1.5 shadow-lg"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Legend */}
        <div className="absolute top-3 right-3 z-[1000] bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl p-3 text-xs text-slate-200 space-y-1.5 shadow-xl">
          <div className="font-semibold text-slate-100 mb-2 text-[11px]">สัญลักษณ์</div>
          {[
            { dot: 'bg-emerald-500', label: 'ช่าง — ว่าง' },
            { dot: 'bg-amber-500', label: 'ช่าง — มีงาน' },
            { dot: 'bg-slate-400', label: 'ช่าง — ออฟไลน์' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
              <span className="text-[10px]">{item.label}</span>
            </div>
          ))}
          <div className="border-t border-slate-700 pt-1.5 space-y-1">
            {[
              { emoji: '🚗', label: 'กำลังเดินทาง' },
              { emoji: '⚙️', label: 'กำลังทำงาน' },
              { emoji: '📋', label: 'รอดำเนินการ' },
              { emoji: '✅', label: 'เสร็จแล้ว' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-xs">{item.emoji}</span>
                <span className="text-[10px]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live indicator */}
        {autoRefresh && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 bg-slate-800/90 border border-emerald-500/30 text-emerald-400 text-[10px] px-3 py-1 rounded-full shadow">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            LIVE — อัปเดตทุก 30 วินาที
          </div>
        )}

        <GISMapView
          workOrders={filteredWOs}
          technicians={filteredTechs}
          selectedTechId={selectedTechId}
          focusTarget={focusTarget}
        />
      </div>
    </div>
  );
}
