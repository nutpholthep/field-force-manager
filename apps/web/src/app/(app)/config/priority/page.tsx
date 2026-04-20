'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { entities } from '@/lib/entity-client';
import type { PriorityMaster } from '@ffm/shared';

const DURATION_UNITS = ['minutes', 'hours', 'days', 'months', 'years'];
const PRIORITY_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#64748b'];

interface PriorityForm {
  name: string;
  code: string;
  color: string;
  duration_value: number;
  duration_unit: string;
  description: string;
  is_active: boolean;
}

export default function ConfigPriority() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<PriorityMaster | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PriorityForm>({ name: '', code: '', color: '#3b82f6', duration_value: 4, duration_unit: 'hours', description: '', is_active: true });

  const { data: priorities = [], isLoading } = useQuery<PriorityMaster[]>({
    queryKey: ['priorityMasters'],
    queryFn: () => entities.PriorityMaster.list('name', 500),
  });

  const openCreate = () => {
    setEditData(null);
    setForm({ name: '', code: '', color: '#3b82f6', duration_value: 4, duration_unit: 'hours', description: '', is_active: true });
    setShowForm(true);
  };

  const openEdit = (p: PriorityMaster) => {
    setEditData(p);
    setForm({ name: p.name, code: p.code || '', color: p.color || '#3b82f6', duration_value: p.duration_value || 4, duration_unit: p.duration_unit || 'hours', description: p.description || '', is_active: p.is_active !== false });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error('Name and Code are required');
      return;
    }
    setSaving(true);
    if (editData?.id) {
      await entities.PriorityMaster.update(editData.id, form as Partial<PriorityMaster>);
    } else {
      await entities.PriorityMaster.create(form as Partial<PriorityMaster>);
    }
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['priorityMasters'] });
    toast.success(editData ? 'Priority updated' : 'Priority created');
  };

  const handleDelete = async (id: string) => {
    await entities.PriorityMaster.delete(id);
    queryClient.invalidateQueries({ queryKey: ['priorityMasters'] });
    toast.success('Priority deleted');
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Priority Master</h2>
          <p className="text-sm text-slate-500 mt-0.5">Define priority levels and their SLA durations</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> Add Priority</Button>
      </div>

      <Card className="overflow-hidden border-slate-200/80">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">SLA Duration</TableHead>
              <TableHead className="text-xs">Description</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">Loading...</TableCell></TableRow>
            ) : priorities.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No priorities yet — add one to get started</TableCell></TableRow>
            ) : priorities.map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color || '#64748b' }} />
                    <span className="font-medium text-sm">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{p.code}</code></TableCell>
                <TableCell className="text-sm text-slate-600">{p.duration_value} {p.duration_unit}</TableCell>
                <TableCell className="text-xs text-slate-500">{p.description || '—'}</TableCell>
                <TableCell>
                  {p.is_active !== false
                    ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Active</Badge>
                    : <Badge variant="outline" className="text-[10px] text-slate-400">Inactive</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editData ? 'Edit Priority' : 'New Priority'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Critical" />
              </div>
              <div>
                <Label>Code *</Label>
                <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} placeholder="e.g. critical" />
              </div>
            </div>
            <div>
              <Label>SLA Duration</Label>
              <div className="flex gap-2">
                <Input type="number" min="1" value={form.duration_value} onChange={(e) => setForm((p) => ({ ...p, duration_value: parseFloat(e.target.value) }))} className="w-24" />
                <Select value={form.duration_unit} onValueChange={(v) => setForm((p) => ({ ...p, duration_unit: v }))}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATION_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRIORITY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="w-7 h-7 rounded cursor-pointer border border-slate-200"
                  title="Custom color"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.is_active ? 'true' : 'false'} onValueChange={(v) => setForm((p) => ({ ...p, is_active: v === 'true' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.code}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
