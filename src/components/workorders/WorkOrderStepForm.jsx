import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronRight,
  Type, Calendar, Camera, Upload, ScanLine, Hash, ToggleLeft, Package, Search, Plus, Minus, X
} from "lucide-react";
import ScanInput from "./ScanInput";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const TASK_TYPE_META = {
  text:     { icon: Type,       label: "Text",       color: "bg-slate-100 text-slate-600" },
  date:     { icon: Calendar,   label: "Date/Time",  color: "bg-blue-100 text-blue-600" },
  photo:    { icon: Camera,     label: "Photo",      color: "bg-purple-100 text-purple-600" },
  file:     { icon: Upload,     label: "File",       color: "bg-orange-100 text-orange-600" },
  scan:     { icon: ScanLine,   label: "Scan",       color: "bg-green-100 text-green-600" },
  number:   { icon: Hash,       label: "Number",     color: "bg-yellow-100 text-yellow-700" },
  checkbox: { icon: ToggleLeft, label: "Checkbox",   color: "bg-pink-100 text-pink-600" },
  material: { icon: Package,    label: "Material",   color: "bg-teal-100 text-teal-700" },
};

// ─── Date helpers ───
function getDateConstraints(config) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = d => d.toISOString().slice(0, 16);

  if (config?.date_range === "future_only") {
    return { min: fmt(new Date()) };
  }
  if (config?.date_range === "past_only") {
    return { max: fmt(new Date()) };
  }
  if (config?.date_range === "offset") {
    const past = new Date(today);
    past.setDate(past.getDate() - (config.offset_past || 0));
    const future = new Date(today);
    future.setDate(future.getDate() + (config.offset_future || 0));
    return { min: fmt(past), max: fmt(future) };
  }
  return {};
}

// ─── Slot-based Material Picker ───
function SlotMaterialPicker({ slot, slotIdx, allMaterials, selectedMaterials, onChange }) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = allMaterials.filter(m => {
    const catOk = !slot.category_ids?.length || slot.category_ids.includes(m.category_id);
    const kwOk = !slot.keywords?.length || slot.keywords.some(kw =>
      m.item_name?.toLowerCase().includes(kw.toLowerCase()) ||
      m.item_number?.toLowerCase().includes(kw.toLowerCase()) ||
      m.keywords?.some(mk => mk.toLowerCase().includes(kw.toLowerCase()))
    );
    const searchOk = !search ||
      m.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.item_number?.toLowerCase().includes(search.toLowerCase()) ||
      m.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()));
    return catOk && kwOk && searchOk && m.is_active !== false;
  });

  const addMaterial = (m) => {
    if (selectedMaterials.find(sm => sm.material_id === m.id)) return;
    onChange([...selectedMaterials, {
      slot: slotIdx,
      material_id: m.id,
      item_number: m.item_number,
      item_name: m.item_name,
      unit: m.unit || "EA",
      quantity_used: 1,
      cost_price: m.cost_price || 0,
      total_cost: m.cost_price || 0,
    }]);
    setSearch("");
    setShowDropdown(false);
  };

  const removeItem = (mid) => onChange(selectedMaterials.filter(sm => sm.material_id !== mid));

  const updateQty = (mid, qty) => onChange(selectedMaterials.map(sm =>
    sm.material_id === mid ? { ...sm, quantity_used: qty, total_cost: qty * (sm.cost_price || 0) } : sm
  ));

  const slotSelected = selectedMaterials.filter(sm => sm.slot === slotIdx || sm.slot === undefined);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-teal-50 border-b border-slate-200 flex items-center gap-2">
        <Package className="w-3.5 h-3.5 text-teal-600" />
        <span className="text-xs font-medium text-teal-700">Slot {slotIdx + 1}</span>
        {slot.category_ids?.length > 0 && <span className="text-[10px] text-slate-400">· กรองตาม category</span>}
        {slot.keywords?.length > 0 && slot.keywords.map(kw => (
          <Badge key={kw} variant="outline" className="text-[10px]">{kw}</Badge>
        ))}
        {slot.allow_custom && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 ml-auto">Custom ✓</Badge>}
      </div>

      {/* Selected items */}
      {slotSelected.length > 0 && (
        <div className="divide-y divide-slate-100">
          {slotSelected.map(sm => (
            <div key={sm.material_id} className="flex items-center gap-2 px-3 py-2 bg-white">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-slate-800 truncate">{sm.item_name}</p>
                  {sm.is_custom && <span className="text-[9px] px-1 py-0.5 bg-amber-100 text-amber-600 rounded shrink-0">custom</span>}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">{sm.item_number} · {sm.unit}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => updateQty(sm.material_id, Math.max(1, (sm.quantity_used || 1) - 1))} className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                  <Minus className="w-3 h-3" />
                </button>
                <input type="number" min="1" value={sm.quantity_used || 1}
                  onChange={e => updateQty(sm.material_id, Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-12 text-center text-xs border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <button type="button" onClick={() => updateQty(sm.material_id, (sm.quantity_used || 1) + 1)} className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button type="button" onClick={() => removeItem(sm.material_id)} className="text-slate-300 hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search & add from list */}
      <div className="p-2 border-t border-slate-100">
        <div className="relative mb-1.5">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="ค้นหา material..."
            className="w-full pl-6 pr-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        {showDropdown && (
          <div className="max-h-40 overflow-y-auto space-y-0.5 border border-slate-100 rounded bg-white shadow-sm">
            {filtered.length === 0 ? (
              <p className="text-center text-[10px] text-slate-400 py-2">ไม่พบสินค้าในรายการ</p>
            ) : filtered.map(m => {
              const added = selectedMaterials.some(sm => sm.material_id === m.id);
              return (
                <div key={m.id}
                  onClick={() => !added && addMaterial(m)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-xs transition-colors ${added ? "bg-blue-50 cursor-default" : "hover:bg-slate-50 cursor-pointer"}`}>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700 truncate">{m.item_name}</span>
                    <span className="text-slate-400 ml-1.5 font-mono text-[10px]">{m.item_number}</span>
                  </div>
                  {added ? <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" /> : <Plus className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
        {showDropdown && (
          <button type="button" onClick={() => setShowDropdown(false)} className="mt-1 text-[10px] text-slate-400 hover:text-slate-600 w-full text-right">ปิด</button>
        )}
      </div>

    </div>
  );
}

// ─── Custom Material Form (task-level) ───
function CustomMaterialForm({ allMats, onAdd }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ item_number: "", item_name: "", unit: "EA", cost_price: "" });
  const [search, setSearch] = useState("");
  const [showDrop, setShowDrop] = useState(false);

  const filtered = allMats.filter(m =>
    !search ||
    m.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.item_number?.toLowerCase().includes(search.toLowerCase())
  );

  const selectFromList = (m) => {
    setForm({ item_number: m.item_number || "", item_name: m.item_name || "", unit: m.unit || "EA", cost_price: String(m.cost_price || "") });
    setSearch(m.item_name);
    setShowDrop(false);
  };

  const handleAdd = () => {
    if (!form.item_name.trim()) return;
    const cost = parseFloat(form.cost_price) || 0;
    onAdd({
      material_id: `custom_${Date.now()}`,
      item_number: form.item_number.trim() || "-",
      item_name: form.item_name.trim(),
      unit: form.unit.trim() || "EA",
      quantity_used: 1,
      cost_price: cost,
      total_cost: cost,
      is_custom: true,
    });
    setForm({ item_number: "", item_name: "", unit: "EA", cost_price: "" });
    setSearch("");
    setShow(false);
  };

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="flex items-center gap-1.5 text-[11px] text-amber-700 hover:text-amber-800 border border-dashed border-amber-300 hover:border-amber-500 rounded-md px-3 py-1.5 bg-amber-50 hover:bg-amber-100 transition-colors font-medium w-full justify-center"
      >
        <Plus className="w-3.5 h-3.5" /> เพิ่ม Material นอกรายการ (Custom)
      </button>
    );
  }

  return (
    <div className="border border-amber-200 rounded-lg bg-amber-50 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-amber-700">เพิ่ม Material Custom</p>
      <div className="relative">
        <label className="text-[10px] text-slate-500 block mb-0.5">ชื่อสินค้า * (พิมพ์เองหรือเลือกจากรายการ)</label>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setForm(p => ({ ...p, item_name: e.target.value })); setShowDrop(true); }}
          onFocus={() => setShowDrop(true)}
          placeholder="ค้นหา หรือ พิมพ์ชื่อ material ใหม่..."
          className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
        {showDrop && search && (
          <div className="absolute z-50 w-full bg-white border border-slate-200 rounded shadow-md max-h-32 overflow-y-auto mt-0.5">
            {filtered.slice(0, 10).map(m => (
              <div key={m.id} onClick={() => selectFromList(m)} className="px-2 py-1.5 text-xs hover:bg-slate-50 cursor-pointer">
                <span className="font-medium text-slate-700">{m.item_name}</span>
                <span className="text-slate-400 ml-1.5 font-mono text-[10px]">{m.item_number}</span>
              </div>
            ))}
            {filtered.length === 0 && <p className="px-2 py-1.5 text-[10px] text-slate-400">ไม่พบ — จะเพิ่มใหม่</p>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 block mb-0.5">รหัสสินค้า</label>
          <input value={form.item_number} onChange={e => setForm(p => ({ ...p, item_number: e.target.value }))} placeholder="Item No." className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-0.5">หน่วย</label>
          <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="EA" className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-0.5">ราคา/หน่วย</label>
          <input type="number" min="0" value={form.cost_price} onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} placeholder="0" className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handleAdd} disabled={!form.item_name.trim()} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs rounded font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" /> เพิ่ม
        </button>
        <button type="button" onClick={() => { setShow(false); setForm({ item_number: "", item_name: "", unit: "EA", cost_price: "" }); setSearch(""); }} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded hover:bg-slate-50 transition-colors">
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

// ─── Task Input ───
function TaskInput({ task, value, onChange, uploading, onUpload, allMaterials }) {
  const type = task.type || "text";
  const config = task.config || {};

  if (type === "text") {
    const max = config.max_length;
    const txt = value?.text || "";
    return (
      <div className="space-y-1">
        <textarea
          maxLength={max || undefined}
          className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 min-h-[72px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-slate-400"
          placeholder="กรอกข้อมูล..."
          value={txt}
          onChange={e => onChange({ text: e.target.value })}
        />
        {max && <p className="text-[10px] text-slate-400 text-right">{txt.length}/{max}</p>}
      </div>
    );
  }

  if (type === "number") {
    return (
      <Input
        type="number"
        step="any"
        min={config.min ?? undefined}
        max={config.max ?? undefined}
        placeholder={[config.min != null ? `min: ${config.min}` : "", config.max != null ? `max: ${config.max}` : ""].filter(Boolean).join(" · ") || "กรอกตัวเลข"}
        value={value?.text || ""}
        onChange={e => onChange({ text: e.target.value })}
      />
    );
  }

  if (type === "date") {
    const constraints = getDateConstraints(config);
    return (
      <Input
        type="datetime-local"
        value={value?.text || ""}
        min={constraints.min}
        max={constraints.max}
        onChange={e => onChange({ text: e.target.value })}
      />
    );
  }

  if (type === "scan") {
    return <ScanInput config={config} value={value} onChange={onChange} />;
  }

  if (type === "checkbox") {
    const options = config.options || [];
    if (options.length > 0) {
      const selected = value?.selected || [];
      return (
        <div className="space-y-1.5">
          {options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={e => {
                  const next = e.target.checked ? [...selected, opt] : selected.filter(s => s !== opt);
                  onChange({ selected: next, text: next.join(", ") });
                }}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      );
    }
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value?.boolean} onChange={e => onChange({ boolean: e.target.checked })} className="w-4 h-4 accent-blue-600" />
        <span className="text-sm text-slate-600">{value?.boolean ? "ใช่ / Yes" : "ไม่ใช่ / No"}</span>
      </label>
    );
  }

  if (type === "photo" || type === "file") {
    const photoCapture = config.photo_source === "camera_only" ? "environment" : config.photo_source === "gallery_only" ? "" : undefined;
    const accept = type === "photo" ? "image/*" : (config.allowed_file_types?.join(",") || undefined);
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-sm text-slate-700 transition-colors border border-slate-200">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {type === "photo" ? "อัปโหลดรูปภาพ" : "อัปโหลดไฟล์"}
          </span>
          <input
            type="file"
            className="hidden"
            accept={accept}
            capture={photoCapture}
            onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
        </label>
        {config.photo_source && config.photo_source !== "any" && (
          <p className="text-[10px] text-slate-400">
            {config.photo_source === "camera_only" ? "📷 ถ่ายจากกล้องเท่านั้น" : "🖼 จากแกลเลอรีเท่านั้น"}
          </p>
        )}
        {config.allowed_file_types?.length > 0 && (
          <p className="text-[10px] text-slate-400">ประเภทไฟล์: {config.allowed_file_types.join(", ")}</p>
        )}
        {value?.file_url && (
          <div className="flex items-center gap-2">
            {type === "photo" ? (
              <img src={value.file_url} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
            ) : (
              <a href={value.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline flex items-center gap-1">
                <Upload className="w-3 h-3" /> {value.file_name || "ดูไฟล์"}
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  if (type === "material") {
    const slots = config.material_slots || [{ id: "default", category_ids: [], keywords: [], allow_custom: true }];
    const mats = value?.materials || [];
    const anyCustomAllowed = slots.some(s => s.allow_custom);
    const customMats = mats.filter(m => m.is_custom);
    return (
      <div className="space-y-2">
        {slots.map((slot, idx) => (
          <SlotMaterialPicker
            key={slot.id || idx}
            slot={slot}
            slotIdx={idx}
            allMaterials={allMaterials}
            selectedMaterials={mats.filter(m => (m.slot ?? 0) === idx && !m.is_custom)}
            onChange={newSlotMats => {
              const otherSlots = mats.filter(m => (m.slot ?? 0) !== idx || m.is_custom);
              const tagged = newSlotMats.map(m => ({ ...m, slot: idx }));
              onChange({ materials: [...otherSlots, ...tagged] });
            }}
          />
        ))}

        {/* Custom materials list */}
        {customMats.length > 0 && (
          <div className="border border-amber-200 rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-100 text-[10px] font-medium text-amber-700">Material นอกรายการ (Custom)</div>
            <div className="divide-y divide-slate-100">
              {customMats.map(sm => {
                const removeCustom = (mid) => onChange({ materials: mats.filter(m => m.material_id !== mid) });
                const updateCustomQty = (mid, qty) => onChange({ materials: mats.map(m => m.material_id === mid ? { ...m, quantity_used: qty, total_cost: qty * (m.cost_price || 0) } : m) });
                return (
                  <div key={sm.material_id} className="flex items-center gap-2 px-3 py-2 bg-white">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{sm.item_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{sm.item_number} · {sm.unit}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => updateCustomQty(sm.material_id, Math.max(1, (sm.quantity_used || 1) - 1))} className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100"><Minus className="w-3 h-3" /></button>
                      <input type="number" min="1" value={sm.quantity_used || 1} onChange={e => updateCustomQty(sm.material_id, Math.max(1, parseFloat(e.target.value) || 1))} className="w-12 text-center text-xs border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                      <button type="button" onClick={() => updateCustomQty(sm.material_id, (sm.quantity_used || 1) + 1)} className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button type="button" onClick={() => removeCustom(sm.material_id)} className="text-slate-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom add button (task-level) */}
        {anyCustomAllowed && (
          <CustomMaterialForm
            allMats={allMaterials}
            onAdd={newMat => onChange({ materials: [...mats, newMat] })}
          />
        )}
      </div>
    );
  }

  return null;
}

function isTaskFilled(task, value) {
  if (!value) return false;
  const t = task.type || "text";
  const config = task.config || {};
  if (t === "checkbox") {
    if ((config.options || []).length > 0) return (value.selected || []).length > 0;
    return value.boolean !== undefined;
  }
  if (t === "material") return (value.materials || []).length > 0;
  if (t === "photo" || t === "file") return !!value.file_url;
  return !!(value.text?.trim());
}

export default function WorkOrderStepForm({ open, onClose, workOrder, serviceType }) {
  const steps = serviceType?.steps || [];
  const [answers, setAnswers] = useState({});
  const [openSteps, setOpenSteps] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);

  const { data: allMaterials = [] } = useQuery({
    queryKey: ["materials_all"],
    queryFn: () => base44.entities.Material.list("-created_date", 1000),
    enabled: open,
  });

  useEffect(() => {
    if (!workOrder?.id || !open) return;
    base44.entities.WorkOrderStepData.filter({ work_order_id: workOrder.id }, "-created_date", 500)
      .then(rows => {
        const map = {};
        rows.forEach(r => {
          const key = `${r.step_id}_${r.task_id}`;
          map[key] = {
            id: r.id,
            text: r.value_text,
            boolean: r.value_boolean,
            selected: r.value_text ? r.value_text.split(", ") : [],
            file_url: r.value_file_url,
            file_name: r.value_file_name,
            materials: r.value_materials || [],
          };
        });
        setAnswers(map);
      });

    const initOpen = {};
    (serviceType?.steps || []).forEach(s => { initOpen[s.id] = true; });
    setOpenSteps(initOpen);
  }, [workOrder?.id, open]);

  const setAnswer = (key, val) => setAnswers(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...val } }));

  const handleUpload = async (key, file) => {
    setUploadingKey(key);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAnswer(key, { file_url, file_name: file.name });
    setUploadingKey(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const existing = await base44.entities.WorkOrderStepData.filter({ work_order_id: workOrder.id });
    const existingMap = Object.fromEntries(existing.map(r => [`${r.step_id}_${r.task_id}`, r]));

    const ops = [];
    for (const step of steps) {
      for (const task of (step.tasks || [])) {
        const key = `${step.id}_${task.id}`;
        const val = answers[key];
        const payload = {
          work_order_id: workOrder.id,
          work_order_number: workOrder.order_number,
          step_id: step.id,
          step_name: step.name,
          task_id: task.id,
          task_label: task.label,
          task_type: task.type || "text",
          value_text: val?.text || null,
          value_boolean: val?.boolean !== undefined ? val.boolean : null,
          value_file_url: val?.file_url || null,
          value_file_name: val?.file_name || null,
          value_materials: val?.materials || [],
        };
        if (existingMap[key]) {
          ops.push(base44.entities.WorkOrderStepData.update(existingMap[key].id, payload));
        } else if (val && (val.text || val.boolean !== undefined || val.file_url || val.materials?.length || val.selected?.length)) {
          ops.push(base44.entities.WorkOrderStepData.create(payload));
        }
      }
    }

    await Promise.all(ops);
    setSaving(false);
    toast.success("บันทึกข้อมูล Step แล้ว");
    onClose();
  };

  const totalTasks = steps.reduce((s, step) => s + (step.tasks || []).length, 0);
  const filledTasks = steps.reduce((s, step) =>
    s + (step.tasks || []).filter(t => isTaskFilled(t, answers[`${step.id}_${t.id}`])).length, 0);

  if (!steps.length) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>กรอกข้อมูล Steps</DialogTitle></DialogHeader>
          <div className="py-8 text-center text-slate-400">
            <p className="text-sm">Service Type นี้ไม่มี Steps ที่กำหนดไว้</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={onClose}>ปิด</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            กรอกข้อมูล Steps
            <Badge variant="outline" className="text-xs font-normal ml-1">{filledTasks}/{totalTasks} รายการ</Badge>
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-0.5">{workOrder?.order_number} · {serviceType?.name}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {steps.map((step, si) => {
            const tasks = step.tasks || [];
            const filledInStep = tasks.filter(t => isTaskFilled(t, answers[`${step.id}_${t.id}`])).length;
            const allFilled = filledInStep === tasks.length && tasks.length > 0;
            const isOpen = openSteps[step.id] !== false;

            return (
              <div key={step.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSteps(prev => ({ ...prev, [step.id]: !isOpen }))}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${allFilled ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"}`}>{si + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{step.name || `Step ${si + 1}`}</p>
                    <p className="text-xs text-slate-400">{filledInStep}/{tasks.length} tasks กรอกแล้ว</p>
                  </div>
                  {step.optional && <Badge variant="outline" className="text-[10px] text-slate-400 shrink-0">Optional</Badge>}
                  {allFilled && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="divide-y divide-slate-100">
                    {tasks.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-slate-400">ไม่มี task ใน step นี้</p>
                    ) : tasks.map(task => {
                      const key = `${step.id}_${task.id}`;
                      const val = answers[key];
                      const filled = isTaskFilled(task, val);
                      const meta = TASK_TYPE_META[task.type] || TASK_TYPE_META.text;
                      const Icon = meta.icon;

                      return (
                        <div key={task.id} className="px-4 py-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${meta.color}`}>
                              <Icon className="w-3 h-3" /> {meta.label}
                            </span>
                            <Label className="text-sm font-medium flex-1">
                              {task.label || "—"}
                              {task.required && <span className="text-red-400 ml-0.5">*</span>}
                            </Label>
                            {filled && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            {task.required && !filled && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </div>
                          <TaskInput
                            task={task}
                            value={val}
                            onChange={newVal => setAnswer(key, newVal)}
                            uploading={uploadingKey === key}
                            onUpload={file => handleUpload(key, file)}
                            allMaterials={allMaterials}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3 shrink-0">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            บันทึกข้อมูล
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}