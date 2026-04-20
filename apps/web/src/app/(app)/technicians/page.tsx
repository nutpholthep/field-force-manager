'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus } from 'lucide-react';
import TechnicianCard from '@/components/technicians/TechnicianCard';
import TechnicianForm from '@/components/technicians/TechnicianForm';
import { Skeleton } from '@/components/ui/skeleton';
import { entities } from '@/lib/entity-client';
import type { Technician } from '@ffm/shared';

export default function Technicians() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Technician | null>(null);
  const queryClient = useQueryClient();

  const { data: technicians = [], isLoading } = useQuery<Technician[]>({
    queryKey: ['technicians'],
    queryFn: () => entities.Technician.list('-created_date', 200),
  });

  const filtered = technicians.filter((t) => {
    const matchSearch = !search || t.full_name?.toLowerCase().includes(search.toLowerCase()) || t.technician_code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleEdit = (tech: Technician) => {
    setEditData(tech);
    setShowForm(true);
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search technicians..." className="pl-9 w-60" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditData(null); setShowForm(true); }}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Technician
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((tech) => (
            <TechnicianCard key={tech.id} tech={tech} onClick={handleEdit} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">
              No technicians found
            </div>
          )}
        </div>
      )}

      {showForm && (
        <TechnicianForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['technicians'] }); }}
          editData={editData}
        />
      )}
    </div>
  );
}
