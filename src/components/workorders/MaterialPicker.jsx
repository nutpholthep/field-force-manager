import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Minus, X, Package } from "lucide-react";

export default function MaterialPicker({ selectedMaterials = [], onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: materials = [] } = useQuery({
    queryKey: ["materials_all"],
    queryFn: () => base44.entities.Material.list("-created_date", 1000),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["materialCategories"],
    queryFn: () => base44.entities.MaterialCategory.list("name", 200),
  });

  const filtered = materials.filter(m => {
    if (m.is_active === false) return false;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      m.item_number?.toLowerCase().includes(q) ||
      m.item_name?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      (m.keywords || []).some(k => k.toLowerCase().includes(q));
    const matchCat = categoryFilter === "all" || m.category_id === categoryFilter;
    return matchSearch && matchCat;
  });

  const addMaterial = (material) => {
    const exists = selectedMaterials.find(sm => sm.material_id === material.id);
    if (exists) return;
    onChange([...selectedMaterials, {
      material_id: material.id,
      item_number: material.item_number,
      item_name: material.item_name,
      unit: material.unit || "EA",
      quantity_used: 1,
      cost_price: material.cost_price || 0,
      total_cost: material.cost_price || 0,
    }]);
  };

  const removeMaterial = (materialId) => {
    onChange(selectedMaterials.filter(sm => sm.material_id !== materialId));
  };

  const updateQty = (materialId, qty) => {
    onChange(selectedMaterials.map(sm =>
      sm.material_id === materialId
        ? { ...sm, quantity_used: qty, total_cost: qty * (sm.cost_price || 0) }
        : sm
    ));
  };

  const totalCost = selectedMaterials.reduce((sum, sm) => sum + (sm.total_cost || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700">Material / อะไหล่ที่ใช้</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowPicker(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่ม Material
        </Button>
      </div>

      {selectedMaterials.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center">
          <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
          <p className="text-xs text-slate-400">ยังไม่มี material ที่เลือก</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
          {selectedMaterials.map(sm => (
            <div key={sm.material_id} className="flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-slate-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{sm.item_name}</p>
                <p className="text-xs text-slate-400 font-mono">{sm.item_number} · {sm.unit}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQty(sm.material_id, Math.max(1, (sm.quantity_used || 1) - 1))}
                  className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={sm.quantity_used || 1}
                  onChange={e => updateQty(sm.material_id, Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-14 text-center text-sm border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => updateQty(sm.material_id, (sm.quantity_used || 1) + 1)}
                  className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              {sm.cost_price > 0 && (
                <span className="text-xs text-slate-500 w-20 text-right shrink-0">
                  ฿{(sm.total_cost || 0).toLocaleString()}
                </span>
              )}
              <button type="button" onClick={() => removeMaterial(sm.material_id)} className="text-slate-300 hover:text-red-400 transition-colors ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {totalCost > 0 && (
            <div className="flex justify-end px-3 py-2 bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">รวม: ฿{totalCost.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Material Picker Dialog */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>เลือก Material</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-3 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="ค้นหารหัส ชื่อ หรือ keyword..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="หมวดหมู่" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-sm">ไม่พบสินค้า</div>
            ) : filtered.map(m => {
              const alreadyAdded = selectedMaterials.some(sm => sm.material_id === m.id);
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                    alreadyAdded
                      ? "border-blue-200 bg-blue-50 cursor-default"
                      : "border-slate-100 hover:border-blue-200 hover:bg-blue-50/50"
                  }`}
                  onClick={() => !alreadyAdded && addMaterial(m)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{m.item_name}</span>
                      {m.category_name && <Badge variant="outline" className="text-[10px]">{m.category_name}</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 font-mono">{m.item_number}</span>
                      {m.unit && <span className="text-xs text-slate-400">· {m.unit}</span>}
                      {m.item_type === "item" && (
                        <span className="text-xs text-slate-400">· คงเหลือ {m.stock_qty || 0}</span>
                      )}
                    </div>
                    {(m.keywords || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.keywords.map(kw => <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>)}
                      </div>
                    )}
                  </div>
                  {m.cost_price > 0 && (
                    <span className="text-sm text-slate-600 shrink-0">฿{m.cost_price.toLocaleString()}</span>
                  )}
                  {alreadyAdded ? (
                    <Badge className="text-[10px] bg-blue-100 text-blue-700 shrink-0">เพิ่มแล้ว</Badge>
                  ) : (
                    <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end mt-3 shrink-0">
            <Button onClick={() => setShowPicker(false)}>เสร็จสิ้น ({selectedMaterials.length} รายการ)</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}