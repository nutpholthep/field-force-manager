import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import MaterialPicker from "./MaterialPicker";

export default function WorkOrderForm({ open, onClose, onSaved, editData }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(editData || {
    title: "",
    description: "",
    priority: "medium",
    priority_id: "",
    service_type: "maintenance",
    customer_name: "",
    site_name: "",
    site_latitude: null,
    site_longitude: null,
    zone_name: "",
    scheduled_date: "",
    scheduled_time: "",
    estimated_duration_hrs: 2,
    required_skills: [],
    sla_due: "",
  });
  const [materials, setMaterials] = useState([]);

  // Load existing materials when editing
  useEffect(() => {
    if (editData?.id) {
      base44.entities.WorkOrderMaterial.filter({ work_order_id: editData.id })
        .then(setMaterials).catch(() => {});
    } else {
      setMaterials([]);
    }
  }, [editData?.id]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.Zone.list(),
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["serviceTypes"],
    queryFn: () => base44.entities.ServiceType.filter({ is_active: true }, "name", 500),
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["skills"],
    queryFn: () => base44.entities.Skill.list("name", 500),
  });

  const { data: allPriorities = [] } = useQuery({
    queryKey: ["priorityMasters"],
    queryFn: () => base44.entities.PriorityMaster.filter({ is_active: true }, "name", 500),
  });

  const skillMap = Object.fromEntries(skills.map(s => [s.id, s]));

  // Determine which priorities to show based on selected service type
  const selectedServiceType = serviceTypes.find(s => s.code === form.service_type);
  const allowedPriorityIds = selectedServiceType?.allowed_priority_ids;
  const availablePriorities = allowedPriorityIds?.length
    ? allPriorities.filter(p => allowedPriorityIds.includes(p.id))
    : allPriorities;

  // When service type changes, auto-fill defaults
  const handleServiceTypeChange = (code) => {
    const st = serviceTypes.find(s => s.code === code);
    const updates = { service_type: code };
    if (st) {
      if (st.default_duration_hrs) updates.estimated_duration_hrs = st.default_duration_hrs;
      // Set default priority from PriorityMaster
      if (st.default_priority_id) {
        const defPrio = allPriorities.find(p => p.id === st.default_priority_id);
        if (defPrio) {
          updates.priority_id = defPrio.id;
          updates.priority = defPrio.code || defPrio.name.toLowerCase();
        }
      }
      if (st.required_skill_ids?.length) {
        updates.required_skills = st.required_skill_ids.map(id => skillMap[id]?.name).filter(Boolean);
      }
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaving(true);
    const orderNumber = editData?.order_number || `WO-${Date.now().toString(36).toUpperCase()}`;
    const matCost = materials.reduce((s, m) => s + (m.total_cost || 0), 0);
    const data = {
      ...form,
      order_number: orderNumber,
      status: form.status || "created",
      equipment_cost: matCost,
    };

    let savedOrder;
    if (editData?.id) {
      savedOrder = await base44.entities.WorkOrder.update(editData.id, data);
      // Delete old materials and re-create
      const oldMats = await base44.entities.WorkOrderMaterial.filter({ work_order_id: editData.id });
      await Promise.all(oldMats.map(m => base44.entities.WorkOrderMaterial.delete(m.id)));
    } else {
      savedOrder = await base44.entities.WorkOrder.create(data);
    }

    const woId = editData?.id || savedOrder?.id;
    if (woId && materials.length > 0) {
      await Promise.all(materials.map(m =>
        base44.entities.WorkOrderMaterial.create({
          ...m,
          work_order_id: woId,
          work_order_number: orderNumber,
        })
      ));
    }

    setSaving(false);
    onSaved();
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // When priority_id changes, sync the priority text field
  const handlePriorityChange = (priorityId) => {
    const p = allPriorities.find(x => x.id === priorityId);
    setForm(prev => ({
      ...prev,
      priority_id: priorityId,
      priority: p ? (p.code || p.name.toLowerCase()) : prev.priority,
    }));
  };

  const selectedPriority = allPriorities.find(p => p.id === form.priority_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Work Order" : "New Work Order"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="Job title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ""} onChange={e => update("description", e.target.value)} placeholder="Details..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Service Type */}
            <div>
              <Label>Service Type</Label>
              <Select value={form.service_type} onValueChange={handleServiceTypeChange}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {serviceTypes.length > 0 ? serviceTypes.map(st => (
                    <SelectItem key={st.id} value={st.code}>{st.name}</SelectItem>
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
              {form.required_skills?.length > 0 && (
                <p className="text-xs text-slate-400 mt-1">Skills: {form.required_skills.join(", ")}</p>
              )}
            </div>

            {/* Priority — from PriorityMaster */}
            <div>
              <Label>Priority</Label>
              {availablePriorities.length > 0 ? (
                <>
                  <Select value={form.priority_id || "__none__"} onValueChange={v => handlePriorityChange(v === "__none__" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority...">
                        {selectedPriority ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: selectedPriority.color || "#64748b" }} />
                            {selectedPriority.name}
                          </span>
                        ) : "Select priority..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availablePriorities.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || "#64748b" }} />
                            <span>{p.name}</span>
                            <span className="text-xs text-slate-400">· {p.duration_value} {p.duration_unit}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedServiceType?.allowed_priority_ids?.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">Filtered by service type</p>
                  )}
                </>
              ) : (
                // Fallback to static priority if no PriorityMaster defined
                <Select value={form.priority} onValueChange={v => update("priority", v)}>
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
              <Select value={form.customer_name || ""} onValueChange={v => update("customer_name", v)}>
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
              <Select value={form.zone_name || ""} onValueChange={v => update("zone_name", v)}>
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
            <Input value={form.site_name || ""} onChange={e => update("site_name", e.target.value)} placeholder="Site name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Scheduled Date</Label>
              <Input type="date" value={form.scheduled_date || ""} onChange={e => update("scheduled_date", e.target.value)} />
            </div>
            <div>
              <Label>Scheduled Time</Label>
              <Input type="time" value={form.scheduled_time || ""} onChange={e => update("scheduled_time", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estimated Duration (hrs)</Label>
              <Input type="number" min="0.5" step="0.5" value={form.estimated_duration_hrs || 2} onChange={e => update("estimated_duration_hrs", parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>SLA Deadline</Label>
              <Input type="datetime-local" value={form.sla_due || ""} onChange={e => update("sla_due", e.target.value)} />
            </div>
          </div>

          {/* Materials */}
          <div className="border-t border-slate-100 pt-4">
            {editData ? (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Material / อะไหล่ที่ใช้</p>
                {materials.length === 0 ? (
                  <p className="text-xs text-slate-400">ไม่มี material (แก้ไขได้ผ่าน "กรอกข้อมูล Steps")</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                    {materials.map(sm => (
                      <div key={sm.material_id || sm.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{sm.item_name}</p>
                          <p className="text-xs text-slate-400 font-mono">{sm.item_number} · {sm.unit} × {sm.quantity_used}</p>
                        </div>
                        {sm.total_cost > 0 && <span className="text-xs text-slate-500">฿{sm.total_cost.toLocaleString()}</span>}
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
            {editData ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}