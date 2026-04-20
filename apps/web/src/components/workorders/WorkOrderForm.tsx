'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import MaterialPicker, { type SelectedMaterial } from './MaterialPicker';
import { entities } from '@/lib/entity-client';
import type {
  Customer,
  PriorityMaster,
  ServiceType,
  Skill,
  WorkOrder,
  WorkOrderMaterial,
  Zone,
} from '@ffm/shared';

// TODO: tighten type — form holds loose values during editing
type FormState = Partial<WorkOrder> & {
  priority_id?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  sla_due?: string | null;
  [key: string]: unknown;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editData?: WorkOrder | null;
}

export default function WorkOrderForm({ open, onClose, onSaved, editData }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(editData ? { ...editData } as FormState : {
    title: '',
    description: '',
    priority: 'medium',
    priority_id: '',
    service_type: 'maintenance',
    customer_name: '',
    site_name: '',
    site_latitude: null,
    site_longitude: null,
    zone_name: '',
    scheduled_date: '',
    scheduled_time: '',
    estimated_duration_hrs: 2,
    required_skills: [],
    sla_due: '',
  });
  const [materials, setMaterials] = useState<SelectedMaterial[]>([]);

  useEffect(() => {
    if (editData?.id) {
      entities.WorkOrderMaterial.filter({ work_order_id: editData.id })
        .then((list: WorkOrderMaterial[]) => {
          const mapped: SelectedMaterial[] = list.map(m => ({
            material_id: m.material_id,
            item_number: m.item_number ?? undefined,
            item_name: m.item_name ?? undefined,
            unit: m.unit ?? undefined,
            quantity_used: m.quantity_used,
            cost_price: m.cost_price ?? 0,
            total_cost: m.total_cost ?? 0,
          }));
          setMaterials(mapped);
        }).catch(() => {});
    } else {
      setMaterials([]);
    }
  }, [editData?.id]);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => entities.Customer.list(),
  });

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: () => entities.Zone.list(),
  });

  const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
    queryKey: ['serviceTypes'],
    queryFn: () => entities.ServiceType.filter({ is_active: true }, 'name', 500),
  });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => entities.Skill.list('name', 500),
  });

  const { data: allPriorities = [] } = useQuery<PriorityMaster[]>({
    queryKey: ['priorityMasters'],
    queryFn: () => entities.PriorityMaster.filter({ is_active: true }, 'name', 500),
  });

  const skillMap = Object.fromEntries(skills.map(s => [s.id, s]));

  const selectedServiceType = serviceTypes.find(s => s.code === form.service_type);
  const allowedPriorityIds = selectedServiceType?.allowed_priority_ids;
  const availablePriorities = allowedPriorityIds?.length
    ? allPriorities.filter(p => allowedPriorityIds.includes(p.id))
    : allPriorities;

  const handleServiceTypeChange = (code: string) => {
    const st = serviceTypes.find(s => s.code === code);
    const updates: Partial<FormState> = { service_type: code as FormState['service_type'] };
    if (st) {
      if (st.default_duration_hrs) updates.estimated_duration_hrs = st.default_duration_hrs;
      if (st.default_priority_id) {
        const defPrio = allPriorities.find(p => p.id === st.default_priority_id);
        if (defPrio) {
          updates.priority_id = defPrio.id;
          updates.priority = (defPrio.code || defPrio.name.toLowerCase()) as FormState['priority'];
        }
      }
      if (st.required_skill_ids?.length) {
        updates.required_skills = st.required_skill_ids.map(id => skillMap[id]?.name).filter(Boolean) as string[];
      }
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  /**
   * Strip fields that are not part of the WorkOrder schema (e.g. priority_id
   * which is only a UI helper) and coerce empty date-strings to undefined so
   * class-validator's @IsDateString doesn't throw a 400.
   */
  const cleanPayload = (raw: Partial<WorkOrder> & Record<string, unknown>): Partial<WorkOrder> => {
    const DATE_FIELDS: (keyof WorkOrder)[] = ['sla_due', 'scheduled_date', 'started_at', 'completed_at'];
    const cleaned = { ...raw };
    // Remove UI-only key
    delete (cleaned as Record<string, unknown>)['priority_id'];
    // Remove empty strings for date fields (allows optional dates to be omitted)
    for (const field of DATE_FIELDS) {
      const val = cleaned[field] as string | undefined | null;
      if (val === '' || val === null || val === undefined) {
        delete cleaned[field];
      } else if (typeof val === 'string') {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          (cleaned as any)[field] = d.toISOString();
        }
      }
    }
    // Remove null lat/lng — backend expects number or omitted
    if (cleaned.site_latitude === null) delete cleaned.site_latitude;
    if (cleaned.site_longitude === null) delete cleaned.site_longitude;
    return cleaned as Partial<WorkOrder>;
  };

  const handleSave = async () => {
    setSaving(true);
    const orderNumber = editData?.order_number || `WO-${Date.now().toString(36).toUpperCase()}`;
    const matCost = materials.reduce((s, m) => s + (m.total_cost || 0), 0);
    const rawData = {
      ...(form as Partial<WorkOrder> & Record<string, unknown>),
      order_number: orderNumber,
      status: form.status || 'created',
      equipment_cost: matCost,
    };
    const data = cleanPayload(rawData);

    let savedOrder: WorkOrder | undefined;
    if (editData?.id) {
      savedOrder = await entities.WorkOrder.update(editData.id, data);
      const oldMats = await entities.WorkOrderMaterial.filter({ work_order_id: editData.id });
      await Promise.all(oldMats.map(m => entities.WorkOrderMaterial.delete(m.id)));
    } else {
      savedOrder = await entities.WorkOrder.create(data);
    }

    const woId = editData?.id || savedOrder?.id;
    if (woId && materials.length > 0) {
      await Promise.all(materials.map(m =>
        entities.WorkOrderMaterial.create({
          ...m,
          work_order_id: woId,
          work_order_number: orderNumber,
        } as Partial<WorkOrderMaterial>)
      ));
    }

    setSaving(false);
    onSaved();
  };

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handlePriorityChange = (priorityId: string) => {
    const p = allPriorities.find(x => x.id === priorityId);
    setForm(prev => ({
      ...prev,
      priority_id: priorityId,
      priority: p ? ((p.code || p.name.toLowerCase()) as FormState['priority']) : prev.priority,
    }));
  };

  const selectedPriority = allPriorities.find(p => p.id === form.priority_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit Work Order' : 'New Work Order'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title || ''} onChange={e => update('title', e.target.value)} placeholder="Job title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => update('description', e.target.value)} placeholder="Details..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Service Type</Label>
              <Select value={form.service_type as string} onValueChange={handleServiceTypeChange}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {serviceTypes.length > 0 ? serviceTypes.map(st => (
                    <SelectItem key={st.id} value={st.code || st.id}>{st.name}</SelectItem>
                  )) : (
                    <>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="upgrade">Upgrade</SelectItem>
                      <SelectItem value="removal">Removal</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {(form.required_skills as string[] | undefined)?.length ? (
                <p className="text-xs text-slate-400 mt-1">Skills: {(form.required_skills as string[]).join(', ')}</p>
              ) : null}
            </div>

            <div>
              <Label>Priority</Label>
              {availablePriorities.length > 0 ? (
                <>
                  <Select value={form.priority_id || '__none__'} onValueChange={v => handlePriorityChange(v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority...">
                        {selectedPriority ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: selectedPriority.color || '#64748b' }} />
                            {selectedPriority.name}
                          </span>
                        ) : 'Select priority...'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availablePriorities.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || '#64748b' }} />
                            <span>{p.name}</span>
                            <span className="text-xs text-slate-400">· {p.duration_value} {p.duration_unit}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(selectedServiceType?.allowed_priority_ids?.length ?? 0) > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">Filtered by service type</p>
                  )}
                </>
              ) : (
                <Select value={form.priority as string} onValueChange={v => update('priority', v as FormState['priority'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Customer</Label>
              <Select value={form.customer_name || ''} onValueChange={v => update('customer_name', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zone</Label>
              <Select value={form.zone_name || ''} onValueChange={v => update('zone_name', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {zones.map(z => (
                    <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Site Name</Label>
            <Input value={form.site_name || ''} onChange={e => update('site_name', e.target.value)} placeholder="Site name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Scheduled Date</Label>
              <Input type="date" value={form.scheduled_date || ''} onChange={e => update('scheduled_date', e.target.value)} />
            </div>
            <div>
              <Label>Scheduled Time</Label>
              <Input type="time" value={form.scheduled_time || ''} onChange={e => update('scheduled_time', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estimated Duration (hrs)</Label>
              <Input type="number" min="0.5" step="0.5" value={form.estimated_duration_hrs ?? 2} onChange={e => update('estimated_duration_hrs', parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>SLA Deadline</Label>
              <Input type="datetime-local" value={form.sla_due || ''} onChange={e => update('sla_due', e.target.value)} />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            {editData ? (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Material / อะไหล่ที่ใช้</p>
                {materials.length === 0 ? (
                  <p className="text-xs text-slate-400">{"ไม่มี material (แก้ไขได้ผ่าน \"กรอกข้อมูล Steps\")"}</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                    {materials.map(sm => (
                      <div key={sm.material_id} className="flex items-center gap-3 px-3 py-2 bg-slate-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{sm.item_name}</p>
                          <p className="text-xs text-slate-400 font-mono">{sm.item_number} · {sm.unit} × {sm.quantity_used}</p>
                        </div>
                        {(sm.total_cost ?? 0) > 0 && <span className="text-xs text-slate-500">฿{sm.total_cost!.toLocaleString()}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <MaterialPicker selectedMaterials={materials} onChange={setMaterials} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editData ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
