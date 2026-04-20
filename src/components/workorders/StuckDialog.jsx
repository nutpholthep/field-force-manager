import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, AlertOctagon, Search, X } from "lucide-react";

const CATEGORY_META = {
  parts:     { label: "อะไหล่/วัสดุ",     color: "bg-orange-100 text-orange-700 border-orange-200" },
  access:    { label: "การเข้าถึงพื้นที่",  color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  technical: { label: "ปัญหาเทคนิค",       color: "bg-red-100 text-red-700 border-red-200" },
  customer:  { label: "ลูกค้า",            color: "bg-blue-100 text-blue-700 border-blue-200" },
  weather:   { label: "สภาพอากาศ",         color: "bg-sky-100 text-sky-700 border-sky-200" },
  other:     { label: "อื่นๆ",             color: "bg-slate-100 text-slate-600 border-slate-200" },
};

const ALL_CAT = "__all__";

export default function StuckDialog({ open, onClose, onConfirm, saving }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(ALL_CAT);

  const { data: reasons = [] } = useQuery({
    queryKey: ["stuckReasons"],
    queryFn: () => base44.entities.StuckReason.filter({ is_active: true }, "name", 200),
    enabled: open,
  });

  // All categories present in data
  const categories = useMemo(() => {
    const cats = [...new Set(reasons.map(r => r.category || "other"))];
    return cats.sort();
  }, [reasons]);

  // Filtered list based on search + active tab
  const filtered = useMemo(() => {
    let list = reasons;
    if (activeTab !== ALL_CAT) list = list.filter(r => (r.category || "other") === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q));
    }
    return list;
  }, [reasons, activeTab, search]);

  // Group filtered by category
  const grouped = useMemo(() => filtered.reduce((acc, r) => {
    const cat = r.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {}), [filtered]);

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm({ stuck_reason_id: selectedReason.id, stuck_reason_name: selectedReason.name, stuck_note: note });
  };

  const handleClose = () => {
    setSearch("");
    setActiveTab(ALL_CAT);
    setSelectedReason(null);
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg flex flex-col" style={{ maxHeight: "90vh" }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertOctagon className="w-4 h-4" />
            ระบุสาเหตุที่งานติดขัด
          </DialogTitle>
        </DialogHeader>

        {reasons.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">ยังไม่มีข้อมูล Stuck Reason — กรุณาเพิ่มใน Master Data ก่อน</p>
        ) : (
          <>
            {/* Search */}
            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาสาเหตุ..."
                className="pl-8 pr-8 h-8 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 shrink-0 scrollbar-hide">
              <button
                onClick={() => setActiveTab(ALL_CAT)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap
                  ${activeTab === ALL_CAT ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}
              >
                ทั้งหมด ({reasons.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap
                    ${activeTab === cat
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}
                >
                  {CATEGORY_META[cat]?.label || cat} ({reasons.filter(r => (r.category || "other") === cat).length})
                </button>
              ))}
            </div>

            {/* Reason list — scrollable */}
            <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-1" style={{ maxHeight: "320px" }}>
              {filtered.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">ไม่พบรายการที่ตรงกัน</p>
              ) : activeTab === ALL_CAT ? (
                Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5 sticky top-0 bg-white py-0.5">
                      {CATEGORY_META[cat]?.label || cat}
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {items.map(r => <ReasonButton key={r.id} r={r} selected={selectedReason?.id === r.id} onClick={() => setSelectedReason(r)} />)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {filtered.map(r => <ReasonButton key={r.id} r={r} selected={selectedReason?.id === r.id} onClick={() => setSelectedReason(r)} />)}
                </div>
              )}
            </div>
          </>
        )}

        {/* Selected badge */}
        {selectedReason && (
          <div className="shrink-0 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedReason.color || "#f59e0b" }} />
            <span className="text-xs font-medium text-amber-800 flex-1">เลือก: {selectedReason.name}</span>
            <button onClick={() => setSelectedReason(null)} className="text-amber-400 hover:text-amber-600"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Note */}
        <div className="shrink-0">
          <Label className="text-xs">หมายเหตุเพิ่มเติม <span className="text-slate-400 font-normal">(ไม่บังคับ)</span></Label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="อธิบายรายละเอียดของปัญหา..."
            className="w-full mt-1 text-xs border border-slate-200 rounded-lg px-3 py-2 min-h-[52px] resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-slate-300"
          />
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={handleClose}>ยกเลิก</Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason || saving}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertOctagon className="w-4 h-4 mr-2" />}
            Mark as Stuck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReasonButton({ r, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all w-full
        ${selected
          ? "border-amber-400 bg-amber-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40"
        }`}
    >
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color || "#f59e0b" }} />
      <span className="text-sm font-medium text-slate-700 flex-1">{r.name}</span>
      {r.code && <span className="text-[10px] text-slate-400 font-mono">{r.code}</span>}
      {selected && (
        <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
        </span>
      )}
    </button>
  );
}