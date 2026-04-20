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
import { Plus, Pencil, Trash2, Loader2, GitBranch, ArrowLeft, Copy } from 'lucide-react';
import { toast } from 'sonner';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import { entities } from '@/lib/entity-client';
import type { Workflow, ServiceType, Technician, Zone } from '@ffm/shared';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  active: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-orange-100 text-orange-600',
};

interface WorkflowFormData {
  name: string;
  version: string;
  description: string;
  status: string;
}

export default function ConfigWorkflows() {
  const queryClient = useQueryClient();
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [showForm, setShowForm] = useState<boolean | Workflow>(false);
  const [formData, setFormData] = useState<WorkflowFormData | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: () => entities.Workflow.list('-created_date', 200),
  });

  const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
    queryKey: ['serviceTypes'],
    queryFn: () => entities.ServiceType.list('name', 500),
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ['technicians'],
    queryFn: () => entities.Technician.list('full_name', 500),
  });

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: () => entities.Zone.list('name', 500),
  });

  const openCreate = () => {
    setFormData({ name: '', version: '1.0', description: '', status: 'draft' });
    setShowForm(true);
  };

  const openEdit = (wf: Workflow) => {
    setFormData({ name: wf.name, version: wf.version || '1.0', description: wf.description || '', status: wf.status || 'draft' });
    setShowForm(wf);
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    if (typeof showForm === 'object' && showForm?.id) {
      await entities.Workflow.update(showForm.id, formData as Partial<Workflow>);
      toast.success('Workflow updated');
    } else {
      const created = await entities.Workflow.create({ ...formData, nodes: [], edges: [] } as Partial<Workflow>);
      toast.success('Workflow created');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setSaving(false);
      setEditingWorkflow(created);
      return;
    }
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['workflows'] });
  };

  const handleDelete = async (id: string) => {
    await entities.Workflow.delete(id);
    queryClient.invalidateQueries({ queryKey: ['workflows'] });
    toast.success('Workflow deleted');
  };

  const handleDuplicate = async (wf: Workflow) => {
    const vParts = (wf.version || '1.0').split('.');
    const newVersion = `${vParts[0]}.${(parseInt(vParts[1] || '0') + 1)}`;
    await entities.Workflow.create({
      name: wf.name,
      version: newVersion,
      description: wf.description,
      status: 'draft',
      nodes: wf.nodes || [],
      edges: wf.edges || [],
    } as Partial<Workflow>);
    queryClient.invalidateQueries({ queryKey: ['workflows'] });
    toast.success(`Duplicated as v${newVersion}`);
  };

  const handleCanvasChange = async ({ nodes, edges }: { nodes: unknown[]; edges: unknown[] }) => {
    if (!editingWorkflow?.id) return;
    await entities.Workflow.update(editingWorkflow.id, { nodes, edges } as Partial<Workflow>);
    setEditingWorkflow((prev) => (prev ? { ...prev, nodes, edges } as Workflow : prev));
    queryClient.invalidateQueries({ queryKey: ['workflows'] });
  };

  if (editingWorkflow) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0">
          <button
            onClick={() => { setEditingWorkflow(null); queryClient.invalidateQueries({ queryKey: ['workflows'] }); }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <GitBranch className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-slate-800">{editingWorkflow.name}</span>
          <Badge variant="outline" className="text-[10px]">v{editingWorkflow.version}</Badge>
          <Badge className={`text-[10px] ${STATUS_COLORS[editingWorkflow.status as string]}`}>{editingWorkflow.status}</Badge>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400">Changes saved automatically</span>
            <Button size="sm" variant="outline" onClick={() => openEdit(editingWorkflow)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Info
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <WorkflowCanvas
            workflow={editingWorkflow}
            serviceTypes={serviceTypes}
            technicians={technicians}
            zones={zones}
            onChange={handleCanvasChange}
          />
        </div>

        {/* Edit Info Dialog */}
        <Dialog open={typeof showForm === 'object' && !!showForm?.id} onOpenChange={() => setShowForm(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Edit Workflow Info</DialogTitle></DialogHeader>
            {formData && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData((p) => p ? { ...p, name: e.target.value } : p)} /></div>
                  <div><Label>Version</Label><Input value={formData.version} onChange={(e) => setFormData((p) => p ? { ...p, version: e.target.value } : p)} placeholder="1.0" /></div>
                </div>
                <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData((p) => p ? { ...p, description: e.target.value } : p)} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData((p) => p ? { ...p, status: v } : p)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Workflows</h2>
          <p className="text-sm text-slate-500 mt-0.5">Design visual service workflows using canvas editor</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> New Workflow</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : workflows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-3 border-dashed">
          <GitBranch className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 font-medium">No workflows yet</p>
          <p className="text-slate-400 text-sm">Create your first workflow to design service processes</p>
          <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> Create Workflow</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workflows.map((wf) => (
            <Card
              key={wf.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setEditingWorkflow(wf)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleDuplicate(wf)} className="p-1 rounded hover:bg-slate-100 text-slate-400" title="Duplicate">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEdit(wf)} className="p-1 rounded hover:bg-slate-100 text-slate-400" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(wf.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1">{wf.name}</h3>
              {wf.description && <p className="text-xs text-slate-400 truncate mb-2">{wf.description}</p>}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">v{wf.version || '1.0'}</Badge>
                <Badge className={`text-[10px] ${STATUS_COLORS[wf.status as string] || STATUS_COLORS.draft}`}>{wf.status || 'draft'}</Badge>
                <span className="text-[10px] text-slate-400 ml-auto">
                  {(wf.nodes || []).length} nodes
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showForm === true} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Workflow</DialogTitle></DialogHeader>
          {formData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData((p) => p ? { ...p, name: e.target.value } : p)} placeholder="e.g. AC Maintenance" /></div>
                <div><Label>Version</Label><Input value={formData.version} onChange={(e) => setFormData((p) => p ? { ...p, version: e.target.value } : p)} placeholder="1.0" /></div>
              </div>
              <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData((p) => p ? { ...p, description: e.target.value } : p)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData((p) => p ? { ...p, status: v } : p)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData?.name}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create & Open Editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
