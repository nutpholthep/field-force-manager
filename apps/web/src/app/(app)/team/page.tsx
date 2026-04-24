'use client';

import { useState } from 'react';
import { entities } from '@/lib/entity-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Settings, Users, Crown, Wrench } from 'lucide-react';
import MasterToolbar from '@/components/master/MasterToolbar';
import { Skeleton } from '@/components/ui/skeleton';
import MemberCard from '@/components/team/MemberCard';
import MemberForm from '@/components/team/MemberForm';
import TeamRoleManager from '@/components/team/TeamRoleManager';
import type { TeamRole, Technician } from '@ffm/shared';

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Technician | null>(null);
  const [showRoles, setShowRoles] = useState(false);
  const queryClient = useQueryClient();
  const normalizedSearch = search.trim();

  const { data: members = [], isLoading } = useQuery<Technician[]>({
    queryKey: ['technicians', normalizedSearch, statusFilter],
    queryFn: () => {
      const where: Record<string, unknown> = {};
      if (normalizedSearch) {
        where.OR = [
          { full_name: { contains: normalizedSearch, mode: 'insensitive' } },
          { technician_code: { contains: normalizedSearch, mode: 'insensitive' } },
          { email: { contains: normalizedSearch, mode: 'insensitive' } },
        ];
      }
      if (statusFilter !== 'all') where.status = statusFilter;
      return entities.Technician.filter(where, '-created_date', 200);
    },
  });

  const { data: roles = [] } = useQuery<TeamRole[]>({
    queryKey: ['teamRoles'],
    queryFn: () => entities.TeamRole.list('name', 100),
  });

  const filtered = members;

  const supervisors = filtered.filter((m) => m.team_role === 'supervisor');
  const engineers = filtered.filter((m) => m.team_role === 'engineer');
  const others = filtered.filter(
    (m) => !m.team_role || (m.team_role !== 'supervisor' && m.team_role !== 'engineer'),
  );

  const handleEdit = (member: Technician) => {
    setEditData(member);
    setShowForm(true);
  };

  const handleImport = async (records: Partial<Technician>[]) => {
    for (const r of records) await entities.Technician.create(r);
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
  };

  const stats = [
    { label: 'Total Members', value: members.length, icon: Users, color: 'text-slate-700' },
    {
      label: 'Supervisors',
      value: members.filter((m) => m.team_role === 'supervisor').length,
      icon: Crown,
      color: 'text-amber-600',
    },
    {
      label: 'Engineers',
      value: members.filter((m) => m.team_role === 'engineer').length,
      icon: Wrench,
      color: 'text-blue-600',
    },
    {
      label: 'Active',
      value: members.filter((m) => m.status === 'active').length,
      icon: Users,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Team</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} / {members.length} members
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <MasterToolbar
            search={search}
            onSearch={setSearch}
            exportData={filtered as unknown as Record<string, unknown>[]}
            onImport={(records) => handleImport(records as unknown as Partial<Technician>[])}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 text-sm border border-slate-200 rounded-md px-2 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
            <option value="suspended">Suspended</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowRoles(true)}>
            <Settings className="w-4 h-4 mr-1.5" /> Manage Roles
          </Button>
          <Button
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All{' '}
            <Badge variant="outline" className="ml-1.5 text-[10px]">
              {filtered.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="supervisor">
            Supervisors{' '}
            <Badge variant="outline" className="ml-1.5 text-[10px]">
              {supervisors.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="engineer">
            Engineers{' '}
            <Badge variant="outline" className="ml-1.5 text-[10px]">
              {engineers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="others">
            Others{' '}
            <Badge variant="outline" className="ml-1.5 text-[10px]">
              {others.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {[
              { value: 'all', list: filtered },
              { value: 'supervisor', list: supervisors },
              { value: 'engineer', list: engineers },
              { value: 'others', list: others },
            ].map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-1">
                  {tab.list.map((m) => (
                    <MemberCard key={m.id} member={m} roles={roles} onClick={handleEdit} />
                  ))}
                  {tab.list.length === 0 && (
                    <div className="col-span-full text-center py-16 text-slate-400">
                      No members found
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>

      {showForm && (
        <MemberForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['technicians'] });
          }}
          editData={editData}
          roles={roles}
        />
      )}

      {showRoles && (
        <TeamRoleManager
          open={showRoles}
          onClose={() => {
            setShowRoles(false);
            queryClient.invalidateQueries({ queryKey: ['teamRoles'] });
          }}
        />
      )}
    </div>
  );
}
