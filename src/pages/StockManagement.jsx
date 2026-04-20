import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Pencil, Trash2, MoreVertical, Package, AlertTriangle, X, Upload } from "lucide-react";
import { toast } from "sonner";

function MaterialForm({ open, onClose, onSaved, editData, categories }) {
  const defaultForm = {
    item_number: "", item_name: "", description: "", category_id: "",
    category_name: "", item_group: "", item_type: "item", unit: "EA",
    warehouse: "", stock_qty: 0, min_stock_qty: 0, cost_price: 0,
    keywords: [], is_active: true,
  };
  const [form, setForm] = useState(editData || defaultForm);
  const [saving, setSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  React.useEffect(() => {
    setForm(editData || defaultForm);
    setKeywordInput("");
  }, [editData, open]);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCategoryChange = (catId) => {
    const cat = categories.find(c => c.id === catId);
    update("category_id", catId);
    update("category_name", cat?.name || "");
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw || form.keywords?.includes(kw)) return;
    update("keywords", [...(form.keywords || []), kw]);
    setKeywordInput("");
  };

  const removeKeyword = (kw) => update("keywords", form.keywords.filter(k => k !== kw));

  const handleSave = async () => {
    if (!form.item_number || !form.item_name) return toast.error("รหัสและชื่อสินค้าจำเป็น");
    setSaving(true);
    if (editData?.id) {
      await base44.entities.Material.update(editData.id, form);
    } else {
      await base44.entities.Material.create(form);
    }
    setSaving(false);
    onSaved();
    toast.success(editData ? "อัปเดตสินค้าแล้ว" : "เพิ่มสินค้าแล้ว");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>รหัสสินค้า *</Label><Input value={form.item_number} onChange={e => update("item_number", e.target.value)} placeholder="เช่น 1OTOT005573" /></div>
            <div><Label>ชื่อสินค้า *</Label><Input value={form.item_name} onChange={e => update("item_name", e.target.value)} placeholder="ชื่อสินค้า" /></div>
          </div>
          <div><Label>รายละเอียด</Label><Input value={form.description || ""} onChange={e => update("description", e.target.value)} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>หมวดหมู่</Label>
              <Select value={form.category_id || ""} onValueChange={handleCategoryChange}>
                <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Item Group</Label><Input value={form.item_group || ""} onChange={e => update("item_group", e.target.value)} placeholder="เช่น RM, CP, FG" /></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>ประเภท</Label>
              <Select value={form.item_type} onValueChange={v => update("item_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="item">Item (คุม Stock)</SelectItem>
                  <SelectItem value="service">Service (ไม่คุม Stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>หน่วย</Label><Input value={form.unit || ""} onChange={e => update("unit", e.target.value)} placeholder="EA, SET, KG" /></div>
            <div><Label>คลังสินค้า</Label><Input value={form.warehouse || ""} onChange={e => update("warehouse", e.target.value)} placeholder="WHA-ST" /></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><Label>จำนวนคงเหลือ</Label><Input type="number" value={form.stock_qty || 0} onChange={e => update("stock_qty", parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Stock ขั้นต่ำ</Label><Input type="number" value={form.min_stock_qty || 0} onChange={e => update("min_stock_qty", parseFloat(e.target.value) || 0)} /></div>
            <div><Label>ราคาต้นทุน</Label><Input type="number" value={form.cost_price || 0} onChange={e => update("cost_price", parseFloat(e.target.value) || 0)} /></div>
          </div>

          {/* Keywords */}
          <div>
            <Label className="mb-2 block">Keywords สำหรับค้นหา</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                placeholder="พิมพ์ keyword แล้วกด Enter หรือ + เพิ่ม"
              />
              <Button type="button" variant="outline" size="sm" onClick={addKeyword}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 rounded-lg border border-slate-200">
              {(form.keywords || []).length === 0 && <span className="text-xs text-slate-400">ยังไม่มี keyword</span>}
              {(form.keywords || []).map(kw => (
                <Badge key={kw} variant="secondary" className="gap-1 text-xs">
                  {kw}
                  <button onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>สถานะ</Label>
            <Select value={form.is_active ? "true" : "false"} onValueChange={v => update("is_active", v === "true")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving || !form.item_number || !form.item_name}>
            {saving && <span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />}
            {editData ? "อัปเดต" : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StockManagement() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: () => base44.entities.Material.list("-created_date", 500),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["materialCategories"],
    queryFn: () => base44.entities.MaterialCategory.list("name", 200),
  });

  const handleDelete = async (id) => {
    await base44.entities.Material.delete(id);
    queryClient.invalidateQueries({ queryKey: ["materials"] });
    toast.success("ลบสินค้าแล้ว");
  };

  const filtered = materials.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !search || 
      m.item_number?.toLowerCase().includes(q) ||
      m.item_name?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.keywords?.some(k => k.toLowerCase().includes(q));
    const matchCat = categoryFilter === "all" || m.category_id === categoryFilter;
    const matchTab = activeTab === "all" || 
      (activeTab === "low_stock" && m.item_type === "item" && (m.stock_qty || 0) <= (m.min_stock_qty || 0));
    return matchSearch && matchCat && matchTab;
  });

  const lowStockCount = materials.filter(m => m.item_type === "item" && (m.stock_qty || 0) <= (m.min_stock_qty || 0)).length;

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">จัดการ Stock สินค้า</h2>
          <p className="text-sm text-slate-500 mt-0.5">บริหารจัดการข้อมูล Material / อะไหล่สำหรับงานบริการ</p>
        </div>
        <Button onClick={() => { setEditData(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> เพิ่มสินค้า
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{materials.length}</p>
            <p className="text-xs text-slate-500">สินค้าทั้งหมด</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            <p className="text-xs text-slate-500">Stock ต่ำกว่าเกณฑ์</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{categories.length}</p>
            <p className="text-xs text-slate-500">หมวดหมู่</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{materials.filter(m => m.is_active).length}</p>
            <p className="text-xs text-slate-500">สินค้า Active</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="ค้นหาด้วยรหัส ชื่อ หรือ keyword..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="หมวดหมู่" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">สินค้าทั้งหมด ({materials.length})</TabsTrigger>
          <TabsTrigger value="low_stock" className={lowStockCount > 0 ? "text-amber-600" : ""}>
            Stock ต่ำ ({lowStockCount})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <Card className="overflow-hidden border-slate-200/80">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs">รหัสสินค้า</TableHead>
                    <TableHead className="text-xs">ชื่อสินค้า</TableHead>
                    <TableHead className="text-xs">หมวดหมู่</TableHead>
                    <TableHead className="text-xs">ประเภท</TableHead>
                    <TableHead className="text-xs">หน่วย</TableHead>
                    <TableHead className="text-xs">Stock คงเหลือ</TableHead>
                    <TableHead className="text-xs">ราคาต้นทุน</TableHead>
                    <TableHead className="text-xs">Keywords</TableHead>
                    <TableHead className="text-xs">สถานะ</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(10)].map((_, j) => (
                          <TableCell key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-slate-400 py-12">
                        ไม่พบสินค้า
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(m => {
                    const isLowStock = m.item_type === "item" && (m.stock_qty || 0) <= (m.min_stock_qty || 0);
                    return (
                      <TableRow key={m.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs text-slate-600">{m.item_number}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-slate-800">{m.item_name}</p>
                          {m.description && <p className="text-xs text-slate-400 truncate max-w-[180px]">{m.description}</p>}
                        </TableCell>
                        <TableCell>
                          {m.category_name ? (
                            <Badge variant="outline" className="text-xs">{m.category_name}</Badge>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${m.item_type === "service" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            {m.item_type === "service" ? "Service" : "Item"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{m.unit || "—"}</TableCell>
                        <TableCell>
                          {m.item_type === "item" ? (
                            <div className="flex items-center gap-1.5">
                              {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              <span className={`text-sm font-medium ${isLowStock ? "text-amber-600" : "text-slate-800"}`}>
                                {m.stock_qty?.toLocaleString() || 0}
                              </span>
                              {m.min_stock_qty > 0 && (
                                <span className="text-xs text-slate-400">/ min {m.min_stock_qty}</span>
                              )}
                            </div>
                          ) : <span className="text-xs text-slate-400">N/A</span>}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {m.cost_price ? `฿${m.cost_price.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(m.keywords || []).slice(0, 3).map(kw => (
                              <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                            ))}
                            {(m.keywords || []).length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">+{m.keywords.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {m.is_active !== false
                            ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Active</Badge>
                            : <Badge variant="outline" className="text-[10px] text-slate-400">Inactive</Badge>}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditData(m); setShowForm(true); }}>
                                <Pencil className="w-3.5 h-3.5 mr-2" /> แก้ไข
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(m.id)} className="text-red-600">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> ลบ
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <MaterialForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["materials"] }); }}
        editData={editData}
        categories={categories}
      />
    </div>
  );
}