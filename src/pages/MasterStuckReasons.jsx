import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, AlertOctagon } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_META = {
  parts:     { label: "อะไหล่/วัสดุ",     color: "bg-orange-100 text-orange-700" },
  access:    { label: "การเข้าถึงพื้นที่",  color: "bg-yellow-100 text-yellow-700" },
  technical: { label: "ปัญหาเทคนิค",       color: "bg-red-100 text-red-700" },
  customer:  { label: "ลูกค้า",            color: "bg-blue-100 text-blue-700" },
  weather:   { label: "สภาพอากาศ",         color: "bg-sky-100 text-sky-700" },
  other:     { label: "อื่นๆ",             color: "bg-slate-100 text-slate-600" },
};

const PRESET_COLORS = ["#f59e0b","#ef4444","#3b82f6","#8b5cf6","#10b981","#64748b"];

export default function MasterStuckReasons() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", code: "", category: "other", description: "", color: "#f59e0b", is_active: true,
  });

  const { data: reasons = [], isLoading } = useQuery({
    queryKey: ["stuckReasons"],
    queryFn: () => base44.entities.StuckReason.list("name", 200),
  });

  const openCreate = () => {
    setEditData(null);
    setForm({ name: "", code: "", category: "other", description: "", color: "#f59e0b", is_active: true });
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditData(r);
    setForm({ name: r.name, code: r.code, category: r.category || "other", description: r.description || "", color: r.color || "#f59e0b", is_active: r.is_active !== false });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editData?.id) {
      await base44.entities.StuckReason.update(editData.id, form);
    } else {
      await base44.entities.StuckReason.create(form);
    }
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["stuckReasons"] });
    toast.success(editData ? "อัปเดตแล้ว" : "สร้างสำเร็จ");
  };

  const handleDelete = async (id) => {
    await base44.entities.StuckReason.delete(id);
    queryClient.invalidateQueries({ queryKey: ["stuckReasons"] });
    toast.success("ลบแล้ว");
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-500" />
            Stuck Reasons
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Master data สำหรับสาเหตุที่งานติดขัด ใช้เลือกเมื่อเปลี่ยนสถานะเป็น Stuck</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> Add Reason</Button>
      </div>

      <Card className="overflow-hidden border-slate-200/80">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="text-xs">ชื่อ</TableHead>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">หมวดหมู่</TableHead>
              <TableHead className="text-xs">รายละเอียด</TableHead>
              <TableHead className="text-xs">สี</TableHead>
              <TableHead className="text-xs">สถานะ</TableHead>
              <TableHead className="text-xs w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">Loading...</TableCell></TableRow>
            ) : reasons.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">ยังไม่มีข้อมูล</TableCell></TableRow>
            ) : reasons.map(r => (
              <TableRow key={r.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color || "#f59e0b" }} />
                    <span className="text-sm font-medium">{r.name}</span>
                  </div>
                </TableCell>
                <TableCell><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{r.code}</code></TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_META[r.category]?.color || "bg-slate-100 text-slate-600"}`}>
                    {CATEGORY_META[r.category]?.label || r.category}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{r.description || "—"}</TableCell>
                <TableCell>
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: r.color || "#f59e0b" }} />
                </TableCell>
                <TableCell>
                  {r.is_active !== false
                    ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Active</Badge>
                    : <Badge variant="outline" className="text-[10px] text-slate-400">Inactive</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(r.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editData ? "แก้ไข Stuck Reason" : "เพิ่ม Stuck Reason"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ชื่อ *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
              </div>
              <div>
                <Label className="text-xs">Code *</Label>
                <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toLowerCase().replace(/\s+/g,"_") }))} placeholder="e.g. no_parts" />
              </div>
            </div>
            <div>
              <Label className="text-xs">หมวดหมู่</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">รายละเอียด</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">สี</Label>
              <div className="flex items-center gap-2 mt-1">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm(p => ({ ...p, color: c }))}
                  />
                ))}
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-7 h-7 rounded cursor-pointer border border-slate-200" />
              </div>
            </div>
            <div>
              <Label className="text-xs">สถานะ</Label>
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
            <Button variant="outline" onClick={() => setShowForm(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.code}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}