import React, { useState } from "react";
import AIStepGenerator from "./AIStepGenerator";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Calendar, Camera, Upload, ScanLine, Hash, Type, ToggleLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import TaskConfigPanel from "./TaskConfigPanel";

const TASK_TYPES = [
  { type: "text",     icon: Type,       label: "Text Input",    color: "bg-slate-100 text-slate-600" },
  { type: "date",     icon: Calendar,   label: "Date/Time",     color: "bg-blue-100 text-blue-600" },
  { type: "photo",    icon: Camera,     label: "Photo",         color: "bg-purple-100 text-purple-600" },
  { type: "file",     icon: Upload,     label: "Upload File",   color: "bg-orange-100 text-orange-600" },
  { type: "scan",     icon: ScanLine,   label: "Scan/Barcode",  color: "bg-green-100 text-green-600" },
  { type: "number",   icon: Hash,       label: "Number",        color: "bg-yellow-100 text-yellow-700" },
  { type: "checkbox", icon: ToggleLeft, label: "Checkbox",      color: "bg-pink-100 text-pink-600" },
  { type: "material", icon: Package,    label: "Material/Form", color: "bg-teal-100 text-teal-700" },
];

function TaskTypeIcon({ type, className = "" }) {
  const t = TASK_TYPES.find(t => t.type === type) || TASK_TYPES[0];
  const Icon = t.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${t.color} ${className}`}>
      <Icon className="w-3 h-3" /> {t.label}
    </span>
  );
}

function TaskRow({ task, onUpdate, onDelete }) {
  return (
    <div className="rounded-lg hover:bg-slate-50 group">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <Input
          value={task.label}
          onChange={e => onUpdate({ ...task, label: e.target.value })}
          className="h-7 text-xs flex-1 min-w-0"
          placeholder="Task label"
        />
        <select
          value={task.type}
          onChange={e => onUpdate({ ...task, type: e.target.value, config: {} })}
          className="h-7 text-xs border border-slate-200 rounded-md px-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
        >
          {TASK_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>
        <label className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0 cursor-pointer select-none">
          <input type="checkbox" checked={!!task.required} onChange={e => onUpdate({ ...task, required: e.target.checked })} className="w-3 h-3" />
          Required
        </label>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <TaskConfigPanel task={task} onUpdate={onUpdate} />
    </div>
  );
}

function StepCard({ step, index, onUpdate, onDelete, total }) {
  const [open, setOpen] = useState(true);

  const addTask = () => {
    const task = { id: `task_${Date.now()}`, label: "", type: "text", required: false };
    onUpdate({ ...step, tasks: [...(step.tasks || []), task] });
  };

  const updateTask = (taskId, updated) => {
    onUpdate({ ...step, tasks: step.tasks.map(t => t.id === taskId ? updated : t) });
  };

  const deleteTask = (taskId) => {
    onUpdate({ ...step, tasks: step.tasks.filter(t => t.id !== taskId) });
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-100">
        <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
        <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{index + 1}</div>
        <Input
          value={step.name}
          onChange={e => onUpdate({ ...step, name: e.target.value })}
          className="h-7 text-sm font-medium flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-slate-700"
          placeholder="Step name e.g. Traveling to Site"
        />
        <label className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0 cursor-pointer select-none">
          <input type="checkbox" checked={!!step.optional} onChange={e => onUpdate({ ...step, optional: e.target.checked })} className="w-3 h-3" />
          Optional
        </label>
        <button onClick={() => setOpen(o => !o)} className="p-1 rounded hover:bg-slate-200 text-slate-400">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="p-3 space-y-1">
          {(step.tasks || []).length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">No tasks — add tasks below</p>
          )}
          {(step.tasks || []).map(task => (
            <TaskRow key={task.id} task={task}
              onUpdate={updated => updateTask(task.id, updated)}
              onDelete={() => deleteTask(task.id)}
            />
          ))}
          <button
            onClick={addTask}
            className="w-full mt-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 text-xs hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>
      )}
    </div>
  );
}

export default function StepTaskEditor({ steps = [], onChange, onAIExtras }) {
  const handleAIApply = (newSteps, mode, extras) => {
    if (mode === "replace") onChange(newSteps);
    else onChange([...steps, ...newSteps]);
    if (extras && onAIExtras) onAIExtras(extras);
  };

  const addStep = () => {
    const step = { id: `step_${Date.now()}`, name: "", optional: false, tasks: [] };
    onChange([...steps, step]);
  };

  const updateStep = (stepId, updated) => {
    onChange(steps.map(s => s.id === stepId ? updated : s));
  };

  const deleteStep = (stepId) => {
    onChange(steps.filter(s => s.id !== stepId));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-slate-700">Service Steps</p>
          <p className="text-[10px] text-slate-400">Define the sequence of steps and tasks for this service type</p>
        </div>
        <AIStepGenerator onApply={handleAIApply} />
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
          <input type="checkbox" checked={steps.length === 0} onChange={e => { if (e.target.checked) onChange([]); }} className="w-3.5 h-3.5" />
          No steps (direct start)
        </label>
      </div>

      {steps.length === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-2xl">⚡</div>
          <div>
            <p className="text-sm font-medium text-slate-600">Direct Start Mode</p>
            <p className="text-xs text-slate-400">Technician arrives on site and begins work immediately, no step tracking needed.</p>
          </div>
        </div>
      )}

      {steps.map((step, i) => (
        <StepCard key={step.id} step={step} index={i} total={steps.length}
          onUpdate={updated => updateStep(step.id, updated)}
          onDelete={() => deleteStep(step.id)}
        />
      ))}

      <button
        onClick={addStep}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-blue-400 hover:text-blue-500 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Step
      </button>
    </div>
  );
}