'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Settings2 } from 'lucide-react';
import { entities } from '@/lib/entity-client';
import type { MaterialCategory } from '@ffm/shared';

interface MaterialSlot {
  id?: string;
  category_ids?: string[];
  keywords?: string[];
  allow_custom?: boolean;
}

interface TaskConfig {
  max_length?: number | null;
  min?: number | null;
  max?: number | null;
  date_range?: 'any' | 'future_only' | 'past_only' | 'offset';
  offset_past?: number | null;
  offset_future?: number | null;
  photo_source?: 'any' | 'camera_only' | 'gallery_only';
  allowed_file_types?: string[];
  scan_type?: 'any' | 'qrcode' | 'barcode' | 'text';
  options?: string[];
  material_slots?: MaterialSlot[];
}

interface Task {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  config?: TaskConfig;
}

interface Props {
  task: Task;
  onUpdate: (task: Task) => void;
}

export default function TaskConfigPanel({ task, onUpdate }: Props) {
  const [showConfig, setShowConfig] = useState(false);
  const config: TaskConfig = task.config || {};

  const set = <K extends keyof TaskConfig>(key: K, val: TaskConfig[K]) =>
    onUpdate({ ...task, config: { ...config, [key]: val } });

  const { data: categories = [] } = useQuery<MaterialCategory[]>({
    queryKey: ['materialCategories'],
    queryFn: () => entities.MaterialCategory.list('name', 200),
    enabled: task.type === 'material',
  });

  if (!['text', 'date', 'photo', 'file', 'scan', 'number', 'checkbox', 'material'].includes(task.type)) return null;

  return (
    <div className="ml-6 mb-1">
      <button
        type="button"
        onClick={() => setShowConfig(s => !s)}
        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-500 transition-colors"
      >
        <Settings2 className="w-3 h-3" />
        {showConfig ? 'ซ่อน Config' : 'Config ตัวเลือก'}
      </button>

      {showConfig && (
        <div className="mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs">

          {task.type === 'text' && (
            <div className="flex items-center gap-2">
              <label className="text-slate-500 shrink-0">จำกัดตัวอักษร (max):</label>
              <Input
                type="number" min="1"
                value={config.max_length || ''}
                onChange={e => set('max_length', e.target.value ? parseInt(e.target.value) : null)}
                className="h-6 w-24 text-xs"
                placeholder="ไม่จำกัด"
              />
            </div>
          )}

          {task.type === 'number' && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
              <div className="flex items-center gap-2">
                <label className="text-slate-500 shrink-0">Min:</label>
                <Input type="number" value={config.min ?? ''} onChange={e => set('min', e.target.value !== '' ? parseFloat(e.target.value) : null)} className="h-6 w-24 text-xs" placeholder="ไม่จำกัด" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-500 shrink-0">Max:</label>
                <Input type="number" value={config.max ?? ''} onChange={e => set('max', e.target.value !== '' ? parseFloat(e.target.value) : null)} className="h-6 w-24 text-xs" placeholder="ไม่จำกัด" />
              </div>
            </div>
          )}

          {task.type === 'date' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-slate-500 shrink-0">ช่วงที่อนุญาต:</label>
                <select
                  value={config.date_range || 'any'}
                  onChange={e => set('date_range', e.target.value as TaskConfig['date_range'])}
                  className="h-6 text-xs border border-slate-200 rounded px-1.5 bg-white"
                >
                  <option value="any">ทุกวัน</option>
                  <option value="future_only">อนาคตเท่านั้น</option>
                  <option value="past_only">อดีตเท่านั้น</option>
                  <option value="offset">บวก/ลบจากวันนี้</option>
                </select>
              </div>
              {config.date_range === 'offset' && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-500 shrink-0">ลบ (วัน):</label>
                    <Input type="number" min="0" value={config.offset_past ?? ''} onChange={e => set('offset_past', e.target.value !== '' ? parseInt(e.target.value) : null)} className="h-6 w-20 text-xs" placeholder="0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-500 shrink-0">บวก (วัน):</label>
                    <Input type="number" min="0" value={config.offset_future ?? ''} onChange={e => set('offset_future', e.target.value !== '' ? parseInt(e.target.value) : null)} className="h-6 w-20 text-xs" placeholder="0" />
                  </div>
                </div>
              )}
            </div>
          )}

          {task.type === 'photo' && (
            <div className="flex items-center gap-2">
              <label className="text-slate-500 shrink-0">แหล่งรูปภาพ:</label>
              <select
                value={config.photo_source || 'any'}
                onChange={e => set('photo_source', e.target.value as TaskConfig['photo_source'])}
                className="h-6 text-xs border border-slate-200 rounded px-1.5 bg-white"
              >
                <option value="any">รูปในเครื่อง หรือ ถ่ายจากกล้อง</option>
                <option value="camera_only">ถ่ายจากกล้องเท่านั้น</option>
                <option value="gallery_only">รูปจากแกลเลอรีเท่านั้น</option>
              </select>
            </div>
          )}

          {task.type === 'file' && (
            <div className="space-y-1.5">
              <label className="text-slate-500">ประเภทไฟล์ที่อนุญาต (เว้นว่าง = ทุกประเภท):</label>
              <FileTypeInput config={config} set={set} />
            </div>
          )}

          {task.type === 'scan' && (
            <div className="flex items-center gap-2">
              <label className="text-slate-500 shrink-0">ประเภท Scan:</label>
              <select
                value={config.scan_type || 'any'}
                onChange={e => set('scan_type', e.target.value as TaskConfig['scan_type'])}
                className="h-6 text-xs border border-slate-200 rounded px-1.5 bg-white"
              >
                <option value="any">ทุกประเภท</option>
                <option value="qrcode">QR Code</option>
                <option value="barcode">Barcode (1D)</option>
                <option value="text">Text / Manual</option>
              </select>
            </div>
          )}

          {task.type === 'checkbox' && (
            <CheckboxOptionsConfig config={config} set={set} />
          )}

          {task.type === 'material' && (
            <MaterialSlotConfig config={config} set={set} categories={categories} />
          )}
        </div>
      )}
    </div>
  );
}

interface ConfigSubProps {
  config: TaskConfig;
  set: <K extends keyof TaskConfig>(key: K, val: TaskConfig[K]) => void;
}

function FileTypeInput({ config, set }: ConfigSubProps) {
  const [input, setInput] = useState('');
  const types = config.allowed_file_types || [];
  const add = () => {
    const v = input.trim();
    if (!v || types.includes(v)) return;
    set('allowed_file_types', [...types, v]);
    setInput('');
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {types.map(t => (
          <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px]">
            {t}
            <button type="button" onClick={() => set('allowed_file_types', types.filter(x => x !== t))} className="hover:text-red-500">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder=".pdf, .xlsx, image/*..." className="h-6 text-xs flex-1" />
        <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={add}><Plus className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}

function CheckboxOptionsConfig({ config, set }: ConfigSubProps) {
  const [input, setInput] = useState('');
  const options = config.options || [];
  const add = () => {
    const v = input.trim();
    if (!v || options.includes(v)) return;
    set('options', [...options, v]);
    setInput('');
  };
  return (
    <div className="space-y-1.5">
      <label className="text-slate-500">ตัวเลือก (ถ้าเว้นว่าง = ใช่/ไม่ใช่):</label>
      <div className="flex flex-wrap gap-1">
        {options.map((opt, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-[10px]">
            {opt}
            <button type="button" onClick={() => set('options', options.filter((_, j) => j !== i))} className="hover:text-red-500">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="เพิ่มตัวเลือก..." className="h-6 text-xs flex-1" />
        <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={add}><Plus className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}

interface MaterialSlotConfigProps extends ConfigSubProps {
  categories: MaterialCategory[];
}

function MaterialSlotConfig({ config, set, categories }: MaterialSlotConfigProps) {
  const slots: MaterialSlot[] = config.material_slots || [{ id: `slot_${Date.now()}`, category_ids: [], keywords: [], allow_custom: true }];

  const updateSlot = (idx: number, updated: MaterialSlot) => {
    const next = [...slots];
    next[idx] = updated;
    set('material_slots', next);
  };

  const addSlot = () => {
    set('material_slots', [...slots, { id: `slot_${Date.now()}`, category_ids: [], keywords: [], allow_custom: true }]);
  };

  const removeSlot = (idx: number) => {
    set('material_slots', slots.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <label className="text-slate-500 font-medium">Material Slots:</label>
      {slots.map((slot, idx) => (
        <SlotRow key={slot.id || idx} slot={slot} idx={idx} categories={categories}
          onChange={u => updateSlot(idx, u)}
          onRemove={() => removeSlot(idx)}
          showRemove={slots.length > 1}
        />
      ))}
      <button
        type="button"
        onClick={addSlot}
        className="flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-700 border border-dashed border-teal-300 rounded-md px-2 py-1 hover:border-teal-500 transition-colors"
      >
        <Plus className="w-3 h-3" /> เพิ่ม Slot
      </button>
    </div>
  );
}

interface SlotRowProps {
  slot: MaterialSlot;
  idx: number;
  categories: MaterialCategory[];
  onChange: (slot: MaterialSlot) => void;
  onRemove: () => void;
  showRemove: boolean;
}

function SlotRow({ slot, idx, categories, onChange, onRemove, showRemove }: SlotRowProps) {
  const [kwInput, setKwInput] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const keywords = slot.keywords || [];
  const categoryIds = slot.category_ids || [];

  const addKw = () => {
    const v = kwInput.trim();
    if (!v || keywords.includes(v)) return;
    onChange({ ...slot, keywords: [...keywords, v] });
    setKwInput('');
  };

  const toggleCat = (catId: string) => {
    const next = categoryIds.includes(catId)
      ? categoryIds.filter(id => id !== catId)
      : [...categoryIds, catId];
    onChange({ ...slot, category_ids: next });
  };

  const filteredCats = categories.filter(c =>
    !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase()) || c.code?.toLowerCase().includes(catSearch.toLowerCase())
  );

  const selectedCatNames = categories.filter(c => categoryIds.includes(c.id)).map(c => c.name);

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-[10px] font-semibold text-slate-500 shrink-0">Slot {idx + 1}</span>

      <div className="flex items-center gap-1.5 flex-1 min-w-[160px] relative">
        <label className="text-[10px] text-slate-400 shrink-0">Category:</label>
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setCatOpen(o => !o)}
            className="w-full flex items-center justify-between gap-1 h-6 px-2 text-[10px] border border-slate-200 rounded bg-white hover:border-teal-400 transition-colors"
          >
            <span className="truncate text-slate-600">
              {selectedCatNames.length === 0 ? 'ทุก category' : selectedCatNames.join(', ')}
            </span>
            <svg className="w-3 h-3 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
          </button>
          {catOpen && (
            <div className="absolute z-50 top-7 left-0 w-52 bg-white border border-slate-200 rounded-lg shadow-lg">
              <div className="p-1.5 border-b border-slate-100">
                <input
                  autoFocus
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                  placeholder="ค้นหา category..."
                  className="w-full text-[10px] border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
              <div className="max-h-40 overflow-y-auto py-1">
                {filteredCats.length === 0 ? (
                  <p className="text-center text-[10px] text-slate-400 py-2">ไม่พบ</p>
                ) : filteredCats.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCat(cat.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] hover:bg-slate-50 transition-colors ${categoryIds.includes(cat.id) ? 'text-teal-700 font-semibold' : 'text-slate-600'}`}
                  >
                    <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${categoryIds.includes(cat.id) ? 'bg-teal-500 border-teal-500' : 'border-slate-300'}`}>
                      {categoryIds.includes(cat.id) && <svg viewBox="0 0 12 12" fill="white" className="w-2 h-2"><path d="M2 6l3 3 5-5"/></svg>}
                    </span>
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 p-1">
                <button type="button" onClick={() => { setCatOpen(false); setCatSearch(''); }} className="w-full text-[10px] text-slate-400 hover:text-slate-600 py-0.5">ปิด</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
        <label className="text-[10px] text-slate-400 shrink-0">Keywords:</label>
        <div className="flex flex-wrap gap-1 flex-1">
          {keywords.map((kw, i) => (
            <span key={i} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full text-[10px]">
              {kw}
              <button type="button" onClick={() => onChange({ ...slot, keywords: keywords.filter((_, j) => j !== i) })} className="hover:text-red-500 ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <div className="flex gap-1">
            <input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKw()} placeholder="+ keyword" className="h-5 w-20 text-[10px] border border-slate-200 rounded px-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400" />
            <button type="button" onClick={addKw} className="h-5 w-5 flex items-center justify-center border border-slate-200 rounded hover:border-teal-400 text-slate-400 hover:text-teal-600"><Plus className="w-3 h-3" /></button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={!!slot.allow_custom} onChange={e => onChange({ ...slot, allow_custom: e.target.checked })} className="w-3 h-3 accent-teal-600" />
          <span className="text-[10px] text-slate-500">Custom</span>
        </label>
        {showRemove && (
          <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-400">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
