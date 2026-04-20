'use client';

import { useState } from 'react';
import { entities } from '@/lib/entity-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import MasterToolbar from '@/components/master/MasterToolbar';
import { Skeleton } from '@/components/ui/skeleton';
import type { Customer } from '@ffm/shared';

const typeColors: Record<string, string> = {
  residential: 'bg-green-100 text-green-700',
  commercial: 'bg-blue-100 text-blue-700',
  industrial: 'bg-purple-100 text-purple-700',
  government: 'bg-amber-100 text-amber-700',
};

type CustomerFormState = Partial<Customer> & {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  type: Customer['type'];
};

const emptyForm: CustomerFormState = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  type: 'commercial' as Customer['type'],
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CustomerFormState>({ ...emptyForm });
  const [typeFilter, setTypeFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => entities.Customer.list('-created_date', 200),
  });

  const filtered = customers.filter((c) => {
    const matchSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const openEdit = (c: Customer) => {
    setEditData(c);
    setForm({
      name: c.name,
      contact_person: c.contact_person || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      type: c.type,
    });
    setShowForm(true);
  };
  const openCreate = () => {
    setEditData(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editData?.id) await entities.Customer.update(editData.id, form);
    else await entities.Customer.create(form);
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleDelete = async (id: string) => {
    await entities.Customer.delete(id);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleImport = async (records: Partial<Customer>[]) => {
    for (const r of records) await entities.Customer.create(r);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Customers</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} / {customers.length} customers
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <MasterToolbar
            search={search}
            onSearch={setSearch}
            exportData={filtered as unknown as Record<string, unknown>[]}
            onImport={(records) => handleImport(records as unknown as Partial<Customer>[])}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 text-sm border border-slate-200 rounded-md px-2 bg-white"
          >
            <option value="all">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="government">Government</option>
          </select>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Add Customer
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-sm text-slate-800">{c.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${typeColors[c.type] || typeColors.commercial}`}
                      >
                        {c.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {c.contact_person || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{c.email || '—'}</TableCell>
                    <TableCell className="text-sm text-slate-600">{c.phone || '—'}</TableCell>
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
                          className="h-7 w-7 text-red-400"
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
        </div>
      </Card>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editData ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                value={form.contact_person || ''}
                onChange={(e) => setForm((p) => ({ ...p, contact_person: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone || ''}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.type || 'commercial'}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as Customer['type'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={form.address || ''}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
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
