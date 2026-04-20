import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, CheckCircle, ExternalLink, ArrowLeft, ListChecks, GitBranch, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import StepTaskEditor from "@/components/servicetype/StepTaskEditor";
import CauseTreeEditor from "@/components/servicetype/CauseTreeEditor";

export default function ConfigServiceTypes() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stepsView, setStepsView] = useState(null); // service type being edited for steps
  const [causesView, setCausesView] = useState(null); // service type being edited for causes
  const [deleteBlock, setDeleteBlock] = useState(null); // { st, usedByWorkflows: [] }
  const [form, setForm] = useState({
    name: "", code: "", description: "",
    required_skill_ids: [],
    allowed_priority_ids: [],
    default_priority_id: "",
    default_duration_hrs: 2,
    is_active: true,
  });

  const { data: serviceTypes = [], isLoading } = useQuery({
    queryKey: ["serviceTypes"],
    queryFn: () => base44.entities.ServiceType.list("name", 500),
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => base44.entities.Workflow.list("name", 200),
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["skills"],
    queryFn: () => base44.entities.Skill.list("name", 500),
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ["priorityMasters"],
    queryFn: () => base44.entities.PriorityMaster.list("name", 500),
  });

  const priorityMap = Object.fromEntries(priorities.map(p => [p.id, p]));

  const openCreate = () => {
    setEditData(null);
    setForm({ name: "", code: "", description: "", required_skill_ids: [], allowed_priority_ids: [], default_priority_id: "", default_duration_hrs: 2, is_active: true });
    setShowForm(true);
  };

  const openEdit = (st) => {
    setEditData(st);
    setForm({
      name: st.name, code: st.code, description: st.description || "",
      required_skill_ids: st.required_skill_ids || [],
      allowed_priority_ids: st.allowed_priority_ids || [],
      default_priority_id: st.default_priority_id || "",
      default_duration_hrs: st.default_duration_hrs || 2,
      is_active: st.is_active !== false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editData?.id) {
      await base44.entities.ServiceType.update(editData.id, form);
    } else {
      await base44.entities.ServiceType.create(form);
    }
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
    toast.success(editData ? "Service type updated" : "Service type created");
  };

  const handleDelete = async (st) => {
    // Check if any workflow uses this service type in its nodes
    const usedBy = workflows.filter(wf =>
      (wf.nodes || []).some(n => n.service_type_id === st.id || n.service_type_name === st.name || n.service_type_name === st.code)
    );
    if (usedBy.length > 0) {
      setDeleteBlock({ st, usedByWorkflows: usedBy });
      return;
    }
    await base44.entities.ServiceType.delete(st.id);
    queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
    toast.success("Service type deleted");
  };

  const toggleSkill = (id) => setForm(prev => ({
    ...prev,
    required_skill_ids: prev.required_skill_ids.includes(id)
      ? prev.required_skill_ids.filter(x => x !== id)
      : [...prev.required_skill_ids, id],
  }));

  const togglePriority = (id) => {
    setForm(prev => {
      const included = prev.allowed_priority_ids.includes(id);
      const newIds = included ? prev.allowed_priority_ids.filter(x => x !== id) : [...prev.allowed_priority_ids, id];
      const newDefault = included && prev.default_priority_id === id ? "" : prev.default_priority_id;
      return { ...prev, allowed_priority_ids: newIds, default_priority_id: newDefault };
    });
  };

  const handleStepsChange = async (steps) => {
    if (!stepsView?.id) return;
    setStepsView(prev => ({ ...prev, steps }));
    await base44.entities.ServiceType.update(stepsView.id, { steps });
    queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
  };

  const handleAIExtras = async (extras) => {
    if (!stepsView?.id) return;
    const updates = {};
    if (extras.default_duration_hrs) updates.default_duration_hrs = extras.default_duration_hrs;
    if (extras.required_skills?.length > 0) {
      // Match skill names to existing skill IDs (case-insensitive)
      const matchedIds = extras.required_skills
        .map(name => skills.find(s => s.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean)
        .map(s => s.id);
      if (matchedIds.length > 0) {
        const merged = [...new Set([...(stepsView.required_skill_ids || []), ...matchedIds])];
        updates.required_skill_ids = merged;
      }
    }
    if (Object.keys(updates).length === 0) return;
    setStepsView(prev => ({ ...prev, ...updates }));
    await base44.entities.ServiceType.update(stepsView.id, updates);
    queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
    toast.success(`AI อัปเดต SLA/Skills แล้ว`);
  };

  const handleCausesChange = async (causes) => {
    if (!causesView?.id) return;
    setCausesView(prev => ({ ...prev, causes }));
    await base44.entities.ServiceType.update(causesView.id, { causes });
    queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
  };

  // Causes Design View
  if (causesView) {
    return (
      <div className="p-4 lg:p-6 max-w-[760px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setCausesView(null)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <GitBranch className="w-4 h-4 text-violet-500" />
          <span className="font-semibold text-slate-800">{causesView.name}</span>
          <Badge variant="outline" className="text-[10px]"><code>{causesView.code}</code></Badge>
          <span className="text-xs text-slate-400 ml-auto">Changes saved automatically</span>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-700">
          <strong>ใช้สำหรับ:</strong> งานซ่อม → ระบุสาเหตุที่เกิดขึ้นและวิธีแก้ไข &nbsp;|&nbsp; งานติดตั้ง/สร้าง → ระบุทิศทางหรือตัวเลือกที่เลือก (สอดคล้องกับ Workflow branches)
        </div>

        <Card className="p-5">
          <CauseTreeEditor
            causes={causesView.causes || []}
            onChange={handleCausesChange}
          />
        </Card>
      </div>
    );
  }

  // Steps Design View
  if (stepsView) {
    return (
      <div className="p-4 lg:p-6 max-w-[900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setStepsView(null)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <ListChecks className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-slate-800">{stepsView.name}</span>
          <Badge variant="outline" className="text-[10px]"><code>{stepsView.code}</code></Badge>
          <span className="text-xs text-slate-400 ml-auto">Changes saved automatically</span>
        </div>

        <Card className="p-5">
          <StepTaskEditor
            steps={stepsView.steps || []}
            onChange={handleStepsChange}
            onAIExtras={handleAIExtras}
          />
        </Card>
      </div>
    );
  }

  // List View
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Service Types</h2>
          <p className="text-sm text-slate-500 mt-0.5">Define service categories with allowed priorities, required skills, and work steps</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> Add Service Type</Button>
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
              <TableHead className="text-xs">Steps</TableHead>
              <TableHead className="text-xs">Causes</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center text-slate-400 py-8">Loading...</TableCell></TableRow>
            ) : serviceTypes.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-slate-400 py-8">No service types yet</TableCell></TableRow>
            ) : serviceTypes.map(st => (
              <TableRow key={st.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <p className="text-sm font-medium">{st.name}</p>
                  {st.description && <p className="text-xs text-slate-400 truncate max-w-[160px]">{st.description}</p>}
                </TableCell>
                <TableCell><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{st.code}</code></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(st.allowed_priority_ids || []).map(pid => priorityMap[pid] ? (
                      <span key={pid} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: priorityMap[pid].color || "#64748b" }}>
                        {priorityMap[pid].name}
                      </span>
                    ) : null)}
                    {!st.allowed_priority_ids?.length && <span className="text-xs text-slate-400">All</span>}
                  </div>
                </TableCell>
                <TableCell>
                  {st.default_priority_id && priorityMap[st.default_priority_id] ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: priorityMap[st.default_priority_id].color || "#64748b" }}>
                      {priorityMap[st.default_priority_id].name}
                    </span>
                  ) : <span className="text-xs text-slate-400">—</span>}
                </TableCell>
                <TableCell className="text-xs text-slate-600">{st.default_duration_hrs}h</TableCell>
                <TableCell>
                  {(st.steps || []).length === 0
                    ? <Badge variant="outline" className="text-[10px] text-slate-400">⚡ Direct</Badge>
                    : <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">{st.steps.length} steps</Badge>
                  }
                </TableCell>
                <TableCell>
                  {(st.causes || []).length === 0
                    ? <Badge variant="outline" className="text-[10px] text-slate-400">None</Badge>
                    : <Badge variant="outline" className="text-[10px] text-violet-600 border-violet-200">{st.causes.length} root(s)</Badge>
                  }
                </TableCell>
                <TableCell>
                  {st.is_active !== false
                    ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Active</Badge>
                    : <Badge variant="outline" className="text-[10px] text-slate-400">Inactive</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:text-blue-600" title="Design Steps" onClick={() => setStepsView(st)}>
                      <ListChecks className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-violet-400 hover:text-violet-600" title="Design Cause Tree" onClick={() => setCausesView(st)}>
                      <GitBranch className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(st)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(st)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Delete blocked dialog */}
      <Dialog open={!!deleteBlock} onOpenChange={() => setDeleteBlock(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> ไม่สามารถลบได้
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">"{deleteBlock?.st?.name}"</span> ถูกใช้งานอยู่ใน Workflow ต่อไปนี้:
            </p>
            <div className="space-y-2">
              {(deleteBlock?.usedByWorkflows || []).map(wf => (
                <div key={wf.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <GitBranch className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-sm font-medium text-amber-800">{wf.name}</span>
                  {wf.status && <span className="text-xs text-amber-500 ml-auto">({wf.status})</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200">
              กรุณาลบ Service Type นี้ออกจาก Workflow ทั้งหมดก่อน แล้วจึงลบได้
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBlock(null)}>ปิด</Button>
            <Link to="/ConfigWorkflows">
              <Button className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                <GitBranch className="w-4 h-4" /> ไปที่ Workflows
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editData ? "Edit Service Type" : "New Service Type"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div>
                <Label>Code *</Label>
                <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toLowerCase().replace(/\s+/g, "_") }))} placeholder="e.g. maintenance" />
              </div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div>
              <Label>Default Duration (hrs)</Label>
              <Input type="number" min="0.5" step="0.5" value={form.default_duration_hrs} onChange={e => setForm(p => ({ ...p, default_duration_hrs: parseFloat(e.target.value) }))} />
            </div>

            {/* Allowed Priorities */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Allowed Priorities</Label>
                <Link to="/ConfigPriority" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 underline">
                  <ExternalLink className="w-3 h-3" /> Create new Priority
                </Link>
              </div>
              {priorities.length === 0 ? (
                <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg p-3 text-center">
                  No priorities defined yet.{" "}
                  <Link to="/ConfigPriority" className="text-blue-500 underline">Add priorities first</Link>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                  {priorities.map(priority => {
                    const isAllowed = form.allowed_priority_ids.includes(priority.id);
                    const isDefault = form.default_priority_id === priority.id;
                    return (
                      <div key={priority.id} className={`flex items-center gap-3 px-3 py-2 transition-colors ${isAllowed ? "bg-slate-50" : "bg-white"}`}>
                        <button type="button" onClick={() => togglePriority(priority.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isAllowed ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"}`}
                        >
                          {isAllowed && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: priority.color || "#64748b" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{priority.name}</p>
                          <p className="text-xs text-slate-400">{priority.duration_value} {priority.duration_unit}</p>
                        </div>
                        {isAllowed && (
                          <button type="button"
                            onClick={() => setForm(p => ({ ...p, default_priority_id: isDefault ? "" : priority.id }))}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors shrink-0 ${isDefault ? "bg-blue-500 text-white border-blue-500" : "border-slate-300 text-slate-500 hover:border-blue-400"}`}
                          >
                            {isDefault ? "Default ✓" : "Set Default"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Skills */}
            <div>
              <Label className="mb-2 block">Required Skills</Label>
              {skills.length === 0 ? (
                <p className="text-xs text-slate-400">No skills defined yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(skill => {
                    const selected = form.required_skill_ids.includes(skill.id);
                    return (
                      <Badge key={skill.id} variant={selected ? "default" : "outline"}
                        className={`cursor-pointer text-xs transition-colors ${selected ? "bg-blue-600 hover:bg-blue-700" : "border-slate-300 text-slate-500 hover:border-blue-400"}`}
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
              <Select value={form.is_active ? "true" : "false"} onValueChange={v => setForm(p => ({ ...p, is_active: v === "true" }))}>
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
              {editData ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}