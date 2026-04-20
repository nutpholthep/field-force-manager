import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ConfigSkills() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [saving, setSaving] = useState(false);

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: () => base44.entities.Skill.list("name", 500),
  });

  const openCreate = () => { setEditData(null); setForm({ name: "", description: "", category: "" }); setShowForm(true); };
  const openEdit = (s) => { setEditData(s); setForm({ name: s.name, description: s.description || "", category: s.category || "" }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editData?.id) {
      await base44.entities.Skill.update(editData.id, form);
    } else {
      await base44.entities.Skill.create(form);
    }
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["skills"] });
    toast.success(editData ? "Skill updated" : "Skill created");
  };

  const handleDelete = async (id) => {
    await base44.entities.Skill.delete(id);
    queryClient.invalidateQueries({ queryKey: ["skills"] });
    toast.success("Skill deleted");
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Skills</h2>
          <p className="text-sm text-slate-500 mt-0.5">Define technician skills and competencies</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> Add Skill</Button>
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
              <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">Loading...</TableCell></TableRow>
            ) : skills.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">No skills yet</TableCell></TableRow>
            ) : skills.map(s => (
              <TableRow key={s.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-sm">{s.name}</TableCell>
                <TableCell>{s.category && <Badge variant="outline" className="text-xs">{s.category}</Badge>}</TableCell>
                <TableCell className="text-xs text-slate-500">{s.description || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(s.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editData ? "Edit Skill" : "New Skill"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Electrical, Mechanical" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}