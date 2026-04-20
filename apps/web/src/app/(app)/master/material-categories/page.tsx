'use client';

import { useState } from 'react';
import { entities } from '@/lib/entity-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import MasterToolbar from '@/components/master/MasterToolbar';
import type { MaterialCategory } from '@ffm/shared';

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

interface CategoryFormState {
  name: string;
  code: string;
  description: string;
  color: string;
  is_active: boolean;
}

type StatusFilter = 'all' | 'active' | 'inactive';

export default function MasterMaterialCategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<MaterialCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CategoryFormState>({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6',
    is_active: true,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

  const handleImport = async (records: Partial<MaterialCategory>[]) => {
    for (const r of records) await entities.MaterialCategory.create(r);
    queryClient.invalidateQueries({ queryKey: ['materialCategories'] });
    toast.success('Import complete');
  };

  const filtered = categories.filter((c) => {
    const matchSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? c.is_active !== false : c.is_active === false);
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">หมวดหมู่ Material</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} / {categories.length} หมวดหมู่
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <MasterToolbar
            search={search}
            onSearch={setSearch}
            filter={statusFilter}
            onFilter={setStatusFilter}
            exportData={filtered as unknown as Record<string, unknown>[]}
            onImport={(records) => handleImport(records as unknown as Partial<MaterialCategory>[])}
          />
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มหมวดหมู่
          </Button>
        </div>
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
                  ยังไม่มีหมวดหมู่
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
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
