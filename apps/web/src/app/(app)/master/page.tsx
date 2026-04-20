'use client';

import { useState } from 'react';
import { entities } from '@/lib/entity-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Wrench,
  Zap,
  CheckCircle,
  Flag,
  ExternalLink,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  MaterialCategory,
  PriorityMaster,
  ServiceType,
  Skill,
} from '@ffm/shared';

const DURATION_UNITS = ['minutes', 'hours', 'days', 'months', 'years'];
const PRIORITY_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#64748b',
];

// ────────────────────────────────────────────────────────────
// Priority Master Section
// ────────────────────────────────────────────────────────────
interface PriorityFormState {
  name: string;
  code: string;
  color: string;
  duration_value: number;
  duration_unit: string;
  description: string;
  is_active: boolean;
}

function PrioritySection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<PriorityMaster | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PriorityFormState>({
    name: '',
    code: '',
    color: '#3b82f6',
    duration_value: 4,
    duration_unit: 'hours',
    description: '',
    is_active: true,
  });

  const { data: priorities = [], isLoading } = useQuery<PriorityMaster[]>({
    queryKey: ['priorityMasters'],
    queryFn: () => entities.PriorityMaster.list('name', 500),
  });

  const openCreate = () => {
    setEditData(null);
    setForm({
      name: '',
      code: '',
      color: '#3b82f6',
      duration_value: 4,
      duration_unit: 'hours',
      description: '',
      is_active: true,
    });
    setShowForm(true);
  };
  const openEdit = (p: PriorityMaster) => {
    setEditData(p);
    setForm({
      name: p.name,
      code: p.code || '',
      color: p.color || '#3b82f6',
      duration_value: p.duration_value || 4,
      duration_unit: p.duration_unit || 'hours',
      description: p.description || '',
      is_active: p.is_active !== false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return toast.error('Name and Code are required');
    setSaving(true);
    if (editData?.id) {
      await entities.PriorityMaster.update(editData.id, form);
    } else {
      await entities.PriorityMaster.create(form);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{priorities.length} priorities defined</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Priority
        </Button>
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
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : priorities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  No priorities yet — add one to get started
                </TableCell>
              </TableRow>
            ) : (
              priorities.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: p.color || '#64748b' }}
                      />
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                      {p.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {p.duration_value} {p.duration_unit}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {p.description || '—'}
                  </TableCell>
                  <TableCell>
                    {p.is_active !== false ? (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-400">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editData ? 'Edit Priority' : 'New Priority'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Critical"
                />
              </div>
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      code: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    }))
                  }
                  placeholder="e.g. critical"
                />
              </div>
            </div>
            <div>
              <Label>SLA Duration</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={form.duration_value}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, duration_value: parseFloat(e.target.value) }))
                  }
                  className="w-24"
                />
                <Select
                  value={form.duration_unit}
                  onValueChange={(v) => setForm((p) => ({ ...p, duration_unit: v }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
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
                    className={`w-7 h-7 rounded-full transition-all ${
                      form.color === c
                        ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                        : 'hover:scale-105'
                    }`}
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
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.is_active ? 'true' : 'false'}
                onValueChange={(v) => setForm((p) => ({ ...p, is_active: v === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
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

// ────────────────────────────────────────────────────────────
// Skill Section
// ────────────────────────────────────────────────────────────
interface SkillFormState {
  name: string;
  description: string;
  category: string;
}

function SkillSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Skill | null>(null);
  const [form, setForm] = useState<SkillFormState>({
    name: '',
    description: '',
    category: '',
  });
  const [saving, setSaving] = useState(false);

  const { data: skills = [], isLoading } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => entities.Skill.list('name', 500),
  });

  const openCreate = () => {
    setEditData(null);
    setForm({ name: '', description: '', category: '' });
    setShowForm(true);
  };
  const openEdit = (s: Skill) => {
    setEditData(s);
    setForm({
      name: s.name,
      description: s.description || '',
      category: s.category || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editData?.id) {
      await entities.Skill.update(editData.id, form);
    } else {
      await entities.Skill.create(form);
    }
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['skills'] });
    toast.success(editData ? 'Skill updated' : 'Skill created');
  };

  const handleDelete = async (id: string) => {
    await entities.Skill.delete(id);
    queryClient.invalidateQueries({ queryKey: ['skills'] });
    toast.success('Skill deleted');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{skills.length} skills defined</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill
        </Button>
      </div>

      <Card className="overflow-hidden border-slate-200/80">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Description</TableHead>
              <TableHead className="text-xs w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : skills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                  No skills yet
                </TableCell>
              </TableRow>
            ) : (
              skills.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell>
                    {s.category && (
                      <Badge variant="outline" className="text-xs">
                        {s.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {s.description || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editData ? 'Edit Skill' : 'New Skill'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="e.g. Electrical, Mechanical"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// ServiceType Section
// ────────────────────────────────────────────────────────────
interface ServiceTypeFormState {
  name: string;
  code: string;
  description: string;
  required_skill_ids: string[];
  allowed_priority_ids: string[];
  default_priority_id: string;
  default_duration_hrs: number;
  is_active: boolean;
}

function ServiceTypeSection({ onGoToPriority }: { onGoToPriority: () => void }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<ServiceType | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ServiceTypeFormState>({
    name: '',
    code: '',
    description: '',
    required_skill_ids: [],
    allowed_priority_ids: [],
    default_priority_id: '',
    default_duration_hrs: 2,
    is_active: true,
  });

  const { data: serviceTypes = [], isLoading } = useQuery<ServiceType[]>({
    queryKey: ['serviceTypes'],
    queryFn: () => entities.ServiceType.list('name', 500),
  });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => entities.Skill.list('name', 500),
  });

  const { data: priorities = [] } = useQuery<PriorityMaster[]>({
    queryKey: ['priorityMasters'],
    queryFn: () => entities.PriorityMaster.list('name', 500),
  });

  const skillMap: Record<string, Skill> = Object.fromEntries(skills.map((s) => [s.id, s]));
  const priorityMap: Record<string, PriorityMaster> = Object.fromEntries(
    priorities.map((p) => [p.id, p]),
  );
  // skillMap is referenced below as needed
  void skillMap;

  const openCreate = () => {
    setEditData(null);
    setForm({
      name: '',
      code: '',
      description: '',
      required_skill_ids: [],
      allowed_priority_ids: [],
      default_priority_id: '',
      default_duration_hrs: 2,
      is_active: true,
    });
    setShowForm(true);
  };

  const openEdit = (st: ServiceType) => {
    setEditData(st);
    setForm({
      name: st.name,
      code: st.code,
      description: st.description || '',
      required_skill_ids: st.required_skill_ids || [],
      allowed_priority_ids: st.allowed_priority_ids || [],
      default_priority_id: st.default_priority_id || '',
      default_duration_hrs: st.default_duration_hrs || 2,
      is_active: st.is_active !== false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editData?.id) {
      await entities.ServiceType.update(editData.id, form);
    } else {
      await entities.ServiceType.create(form);
    }
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['serviceTypes'] });
    toast.success(editData ? 'Service type updated' : 'Service type created');
  };

  const handleDelete = async (id: string) => {
    await entities.ServiceType.delete(id);
    queryClient.invalidateQueries({ queryKey: ['serviceTypes'] });
    toast.success('Service type deleted');
  };

  const toggleSkill = (id: string) =>
    setForm((prev) => ({
      ...prev,
      required_skill_ids: prev.required_skill_ids.includes(id)
        ? prev.required_skill_ids.filter((x) => x !== id)
        : [...prev.required_skill_ids, id],
    }));

  const togglePriority = (id: string) => {
    setForm((prev) => {
      const included = prev.allowed_priority_ids.includes(id);
      const newIds = included
        ? prev.allowed_priority_ids.filter((x) => x !== id)
        : [...prev.allowed_priority_ids, id];
      const newDefault =
        included && prev.default_priority_id === id ? '' : prev.default_priority_id;
      return { ...prev, allowed_priority_ids: newIds, default_priority_id: newDefault };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{serviceTypes.length} service types defined</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Service Type
        </Button>
      </div>

      <Card className="overflow-hidden border-slate-200/80">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Allowed Priorities</TableHead>
              <TableHead className="text-xs">Default Priority</TableHead>
              <TableHead className="text-xs">Duration</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : serviceTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                  No service types yet
                </TableCell>
              </TableRow>
            ) : (
              serviceTypes.map((st) => (
                <TableRow key={st.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <p className="text-sm font-medium">{st.name}</p>
                    {st.description && (
                      <p className="text-xs text-slate-400 truncate max-w-[160px]">
                        {st.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                      {st.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(st.allowed_priority_ids || []).map((pid) =>
                        priorityMap[pid] ? (
                          <span
                            key={pid}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                            style={{ backgroundColor: priorityMap[pid].color || '#64748b' }}
                          >
                            {priorityMap[pid].name}
                          </span>
                        ) : null,
                      )}
                      {!st.allowed_priority_ids?.length && (
                        <span className="text-xs text-slate-400">All</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {st.default_priority_id && priorityMap[st.default_priority_id] ? (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                        style={{
                          backgroundColor:
                            priorityMap[st.default_priority_id].color || '#64748b',
                        }}
                      >
                        {priorityMap[st.default_priority_id].name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {st.default_duration_hrs}h
                  </TableCell>
                  <TableCell>
                    {st.is_active !== false ? (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-400">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(st)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
                        onClick={() => handleDelete(st.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editData ? 'Edit Service Type' : 'New Service Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      code: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    }))
                  }
                  placeholder="e.g. maintenance"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Default Duration (hrs)</Label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={form.default_duration_hrs}
                onChange={(e) =>
                  setForm((p) => ({ ...p, default_duration_hrs: parseFloat(e.target.value) }))
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Allowed Priorities</Label>
                <button
                  onClick={onGoToPriority}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 underline"
                >
                  <ExternalLink className="w-3 h-3" /> Create new Priority
                </button>
              </div>
              {priorities.length === 0 ? (
                <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg p-3 text-center">
                  No priorities defined yet.{' '}
                  <button onClick={onGoToPriority} className="text-blue-500 underline">
                    Add priorities first
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                  {priorities.map((priority) => {
                    const isAllowed = form.allowed_priority_ids.includes(priority.id);
                    const isDefault = form.default_priority_id === priority.id;
                    return (
                      <div
                        key={priority.id}
                        className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                          isAllowed ? 'bg-slate-50' : 'bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => togglePriority(priority.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isAllowed
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isAllowed && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: priority.color || '#64748b' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{priority.name}</p>
                          <p className="text-xs text-slate-400">
                            {priority.duration_value} {priority.duration_unit}
                          </p>
                        </div>
                        {isAllowed && (
                          <button
                            type="button"
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                default_priority_id: isDefault ? '' : priority.id,
                              }))
                            }
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors shrink-0 ${
                              isDefault
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-slate-300 text-slate-500 hover:border-blue-400'
                            }`}
                          >
                            {isDefault ? 'Default ✓' : 'Set Default'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Required Skills</Label>
              {skills.length === 0 ? (
                <p className="text-xs text-slate-400">No skills defined yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => {
                    const selected = form.required_skill_ids.includes(skill.id);
                    return (
                      <Badge
                        key={skill.id}
                        variant={selected ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs transition-colors ${
                          selected
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'border-slate-300 text-slate-500 hover:border-blue-400'
                        }`}
                        onClick={() => toggleSkill(skill.id)}
                      >
                        {selected && <CheckCircle className="w-2.5 h-2.5 mr-1" />}
                        {skill.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={form.is_active ? 'true' : 'false'}
                onValueChange={(v) => setForm((p) => ({ ...p, is_active: v === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
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

// ────────────────────────────────────────────────────────────
// MaterialCategory Section
// ────────────────────────────────────────────────────────────
const CAT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#64748b',
];

interface MaterialCategoryFormState {
  name: string;
  code: string;
  description: string;
  color: string;
  is_active: boolean;
}

function MaterialCategorySection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<MaterialCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MaterialCategoryFormState>({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6',
    is_active: true,
  });

  const { data: categories = [], isLoading } = useQuery<MaterialCategory[]>({
    queryKey: ['materialCategories'],
    queryFn: () => entities.MaterialCategory.list('name', 200),
  });

  const openCreate = () => {
    setEditData(null);
    setForm({ name: '', code: '', description: '', color: '#3b82f6', is_active: true });
    setShowForm(true);
  };
  const openEdit = (c: MaterialCategory) => {
    setEditData(c);
    setForm({
      name: c.name,
      code: c.code,
      description: c.description || '',
      color: c.color || '#3b82f6',
      is_active: c.is_active !== false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return toast.error('Name and Code are required');
    setSaving(true);
    if (editData?.id) {
      await entities.MaterialCategory.update(editData.id, form);
    } else {
      await entities.MaterialCategory.create(form);
    }
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['materialCategories'] });
    toast.success(editData ? 'อัปเดตหมวดหมู่แล้ว' : 'เพิ่มหมวดหมู่แล้ว');
  };

  const handleDelete = async (id: string) => {
    await entities.MaterialCategory.delete(id);
    queryClient.invalidateQueries({ queryKey: ['materialCategories'] });
    toast.success('ลบหมวดหมู่แล้ว');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{categories.length} หมวดหมู่ที่กำหนด</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มหมวดหมู่
        </Button>
      </div>
      <Card className="overflow-hidden border-slate-200/80">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="text-xs">ชื่อหมวดหมู่</TableHead>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">รายละเอียด</TableHead>
              <TableHead className="text-xs">สถานะ</TableHead>
              <TableHead className="text-xs w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                  ยังไม่มีหมวดหมู่ — เพิ่มหมวดหมู่ Material
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.color || '#64748b' }}
                      />
                      <span className="font-medium text-sm">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                      {c.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {c.description || '—'}
                  </TableCell>
                  <TableCell>
                    {c.is_active !== false ? (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-400">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editData ? 'แก้ไขหมวดหมู่' : 'หมวดหมู่ใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ชื่อหมวดหมู่ *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="เช่น อะไหล่ไฟฟ้า"
                />
              </div>
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      code: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    }))
                  }
                  placeholder="เช่น electrical"
                />
              </div>
            </div>
            <div>
              <Label>รายละเอียด</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-2 block">สี</Label>
              <div className="flex gap-2 flex-wrap">
                {CAT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-7 h-7 rounded-full transition-all ${
                      form.color === c
                        ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>สถานะ</Label>
              <Select
                value={form.is_active ? 'true' : 'false'}
                onValueChange={(v) => setForm((p) => ({ ...p, is_active: v === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.code}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? 'อัปเดต' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────
export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('service_types');

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Master Data</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage system-wide options: priorities, service types, skills, and material categories
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="priorities" className="flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5" /> Priority Master
          </TabsTrigger>
          <TabsTrigger value="service_types" className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Service Types
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Skills
          </TabsTrigger>
          <TabsTrigger value="material_categories" className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> หมวดหมู่ Material
          </TabsTrigger>
        </TabsList>
        <TabsContent value="priorities" className="mt-4">
          <PrioritySection />
        </TabsContent>
        <TabsContent value="service_types" className="mt-4">
          <ServiceTypeSection onGoToPriority={() => setActiveTab('priorities')} />
        </TabsContent>
        <TabsContent value="skills" className="mt-4">
          <SkillSection />
        </TabsContent>
        <TabsContent value="material_categories" className="mt-4">
          <MaterialCategorySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
