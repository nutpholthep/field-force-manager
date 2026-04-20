'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Gauge, Shield, Crown, Wrench, Link2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TeamRole, Technician } from '@ffm/shared';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-500',
  on_leave: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

const availColors: Record<string, string> = {
  available: 'bg-green-500',
  busy: 'bg-amber-500',
  offline: 'bg-slate-400',
  break: 'bg-blue-500',
};

const roleIcons: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  supervisor: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50' },
  engineer: { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
};

interface Props {
  member: Technician;
  roles?: TeamRole[];
  onClick: (member: Technician) => void;
}

export default function MemberCard({ member, roles = [], onClick }: Props) {
  const roleDef = roles.find(r => r.code === member.team_role);
  const roleDisplay = roleDef?.name || member.team_role_name || member.team_role;
  const roleKey = member.team_role || '';
  const roleStyle = roleIcons[roleKey] || { icon: null as LucideIcon | null, color: 'text-slate-500', bg: 'bg-slate-50' };
  const RoleIcon = roleStyle.icon;
  const isLinked = !!member.linked_user_id;

  return (
    <Card
      className="p-4 bg-white border-slate-200/80 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onClick(member)}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLinked ? 'bg-blue-100' : 'bg-slate-100'}`}>
            <span className={`text-sm font-bold ${isLinked ? 'text-blue-600' : 'text-slate-600'}`}>
              {member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${availColors[member.availability] || availColors.offline}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-slate-800 truncate">{member.full_name}</p>
            <Badge className={`text-[9px] ${statusColors[member.status] || statusColors.inactive}`}>{member.status}</Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono">{member.technician_code}</p>
          {roleDisplay && (
            <div className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${roleStyle.bg} ${roleStyle.color}`}>
              {RoleIcon && <RoleIcon className="w-2.5 h-2.5" />}
              {roleDisplay}
            </div>
          )}
          {member.team_name && (
            <p className="text-[10px] text-slate-400 mt-0.5">📁 {member.team_name}</p>
          )}
          {member.zone_name && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">{member.zone_name}</span>
            </div>
          )}
          {isLinked ? (
            <div className="flex items-center gap-1 mt-0.5">
              <Link2 className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-blue-500 truncate">{member.linked_user_email}</span>
            </div>
          ) : (
            <p className="text-[10px] text-slate-300 mt-0.5">No user linked</p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
          <Star className="w-3 h-3 text-amber-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{member.customer_rating?.toFixed(1) || '—'}</p>
          <p className="text-[9px] text-slate-400">Rating</p>
        </div>
        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
          <Gauge className="w-3 h-3 text-blue-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{member.performance_score || '—'}</p>
          <p className="text-[9px] text-slate-400">Score</p>
        </div>
        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
          <Shield className="w-3 h-3 text-emerald-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{member.sla_compliance_rate ? `${member.sla_compliance_rate}%` : '—'}</p>
          <p className="text-[9px] text-slate-400">SLA</p>
        </div>
      </div>

      {(member.skills?.length ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map(s => (
            <Badge key={s} variant="outline" className="text-[9px] border-emerald-200 text-emerald-600">{s}</Badge>
          ))}
          {member.skills.length > 3 && (
            <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-400">+{member.skills.length - 3}</Badge>
          )}
        </div>
      )}
    </Card>
  );
}
