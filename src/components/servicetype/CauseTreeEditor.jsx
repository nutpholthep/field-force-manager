import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronRight, ChevronDown, GitBranch } from "lucide-react";

// Recursive node component for one cause item
function CauseNode({ node, depth, onChange, onDelete, maxDepth = 3 }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const canAddChild = depth < maxDepth;

  const updateLabel = (label) => onChange({ ...node, label });

  const addChild = () => {
    const newChild = { id: crypto.randomUUID(), label: "", children: [] };
    onChange({ ...node, children: [...(node.children || []), newChild] });
  };

  const updateChild = (idx, updated) => {
    const children = [...(node.children || [])];
    children[idx] = updated;
    onChange({ ...node, children });
  };

  const deleteChild = (idx) => {
    const children = (node.children || []).filter((_, i) => i !== idx);
    onChange({ ...node, children });
  };

  const indentColors = ["border-blue-300", "border-violet-300", "border-emerald-300"];
  const bgColors = ["bg-blue-50", "bg-violet-50", "bg-emerald-50"];
  const dotColors = ["bg-blue-400", "bg-violet-400", "bg-emerald-400"];

  return (
    <div className={`border-l-2 pl-3 ${indentColors[depth - 1] || "border-slate-200"} mt-1.5`}>
      <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${bgColors[depth - 1] || "bg-slate-50"}`}>
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="text-slate-400 hover:text-slate-700 w-4 h-4 flex items-center justify-center shrink-0"
        >
          {hasChildren
            ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)
            : <div className={`w-2 h-2 rounded-full ${dotColors[depth - 1] || "bg-slate-300"}`} />
          }
        </button>

        <Input
          value={node.label}
          onChange={e => updateLabel(e.target.value)}
          placeholder={depth === 1 ? "Cause (L1)..." : depth === 2 ? "Sub-cause (L2)..." : "Detail (L3)..."}
          className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 flex-1 placeholder:text-slate-400"
        />

        <div className="flex items-center gap-1 shrink-0">
          <Badge className={`text-[9px] px-1 py-0 h-4 ${depth === 1 ? "bg-blue-100 text-blue-700" : depth === 2 ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
            L{depth}
          </Badge>
          {canAddChild && (
            <button type="button" onClick={addChild}
              className="w-5 h-5 rounded hover:bg-white flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
              title="Add sub-cause"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
          <button type="button" onClick={onDelete}
            className="w-5 h-5 rounded hover:bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="ml-1">
          {node.children.map((child, idx) => (
            <CauseNode
              key={child.id}
              node={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              onChange={(updated) => updateChild(idx, updated)}
              onDelete={() => deleteChild(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CauseTreeEditor({ causes = [], onChange }) {
  const addRoot = () => {
    const newNode = { id: crypto.randomUUID(), label: "", children: [] };
    onChange([...causes, newNode]);
  };

  const updateRoot = (idx, updated) => {
    const next = [...causes];
    next[idx] = updated;
    onChange(next);
  };

  const deleteRoot = (idx) => {
    onChange(causes.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Cause Tree</span>
          <span className="text-xs text-slate-400">(max 3 levels)</span>
        </div>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addRoot}>
          <Plus className="w-3 h-3 mr-1" /> Add Cause
        </Button>
      </div>

      <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2.5 flex gap-3">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> L1 = Root cause</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> L2 = Sub-cause</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> L3 = Detail</span>
      </div>

      {causes.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
          <GitBranch className="w-7 h-7 mx-auto text-slate-300 mb-2" />
          <p className="text-xs text-slate-400">No causes defined yet</p>
          <Button type="button" size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={addRoot}>
            <Plus className="w-3 h-3 mr-1" /> Add First Cause
          </Button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl p-3 space-y-0.5 max-h-72 overflow-y-auto">
          {causes.map((node, idx) => (
            <CauseNode
              key={node.id}
              node={node}
              depth={1}
              maxDepth={3}
              onChange={(updated) => updateRoot(idx, updated)}
              onDelete={() => deleteRoot(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}