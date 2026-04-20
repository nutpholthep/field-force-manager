'use client';

import { X, Users, MapPin, Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Technician, Zone } from '@ffm/shared';

interface WorkflowNodeConfig {
  id: string;
  label: string;
  assignee_mode?: 'manual' | 'zone' | 'auto';
  allowed_technician_ids?: string[];
  allowed_zone_ids?: string[];
  [key: string]: unknown;
}

interface Props {
  node: WorkflowNodeConfig;
  technicians: Technician[];
  zones: Zone[];
  onClose: () => void;
  onChange: (node: WorkflowNodeConfig) => void;
}

export default function NodeConfigPanel({ node, technicians, zones, onClose, onChange }: Props) {
  const update = (patch: Partial<WorkflowNodeConfig>) => onChange({ ...node, ...patch });

  const toggleTech = (id: string) => {
    const ids = node.allowed_technician_ids || [];
    update({ allowed_technician_ids: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] });
  };

  const toggleZone = (id: string) => {
    const ids = node.allowed_zone_ids || [];
    update({ allowed_zone_ids: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] });
  };

  return (
    <div className="w-72 border-l border-slate-200 bg-white flex flex-col overflow-y-auto shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-800">{node.label}</p>
          <p className="text-xs text-slate-400">Node Configuration</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label className="mb-1.5 block text-xs">Assignment Mode</Label>
          <Select value={node.assignee_mode || 'manual'} onValueChange={v => update({ assignee_mode: v as WorkflowNodeConfig['assignee_mode'] })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">👤 Manual (Dispatcher chooses)</SelectItem>
              <SelectItem value="zone">📍 By Zone (Any tech in zone)</SelectItem>
              <SelectItem value="auto">⚡ Auto Assign (From schedule)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-400 mt-1">
            {node.assignee_mode === 'auto'
              ? 'System will auto-assign available technician from schedule'
              : node.assignee_mode === 'zone'
              ? 'Restrict to technicians in selected zones'
              : 'Dispatcher manually picks technician'}
          </p>
        </div>

        {(node.assignee_mode === 'zone' || node.assignee_mode === 'auto') && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <Label className="text-xs">Allowed Zones</Label>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {zones.length === 0 && <p className="text-xs text-slate-400">No zones defined</p>}
              {zones.map(zone => {
                const sel = (node.allowed_zone_ids || []).includes(zone.id);
                return (
                  <button key={zone.id} onClick={() => toggleZone(zone.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors text-left ${sel ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: zone.color || '#64748b' }} />
                    {zone.name}
                    {sel && <span className="ml-auto text-blue-500">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {node.assignee_mode === 'manual' && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <Label className="text-xs">Allowed Technicians</Label>
              <span className="text-[10px] text-slate-400">(empty = all)</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {technicians.length === 0 && <p className="text-xs text-slate-400">No technicians defined</p>}
              {technicians.filter(t => t.status === 'active').map(tech => {
                const sel = (node.allowed_technician_ids || []).includes(tech.id);
                return (
                  <button key={tech.id} onClick={() => toggleTech(tech.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors text-left ${sel ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-semibold text-blue-600 shrink-0">
                      {tech.full_name?.[0] || 'T'}
                    </div>
                    <span className="truncate">{tech.full_name}</span>
                    {sel && <span className="ml-auto text-blue-500 shrink-0">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {node.assignee_mode === 'auto' && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">System will automatically find the best available technician from the schedule based on zone and capacity.</p>
          </div>
        )}
      </div>
    </div>
  );
}
