import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Info } from "lucide-react";

const SYSTEM_ROLES = ["supervisor", "engineer"];

const DEFAULT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16", "#f97316"];

export default function TeamRoleManager({ open, onClose }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", code: "", color: DEFAULT_COLORS[0], description: "" });

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["teamRoles"],
    queryFn: () => base44.entities.TeamRole.list("name", 100),
  });

  const handleAdd = async () => {
    if (!newRole.name || !newRole.code) return;
    setSaving(true);
    await base44.entities.TeamRole.create({ ...newRole, is_active: true });
    qc.invalidateQueries({ queryKey: ["teamRoles"] });
    setNewRole({ name: "", code: "", color: DEFAULT_COLORS[0], description: "" });
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.TeamRole.delete(id);
    qc.invalidateQueries({ queryKey: ["teamRoles"] });
  };

  const handleToggle = async (role) => {
    await base44.entities.TeamRole.update(role.id, { is_active: !role.is_active });
    qc.invalidateQueries({ queryKey: ["teamRoles"] });
  };

  const autoCode = (name) => name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Team Roles</DialogTitle>
        </DialogHeader>

        {/* Built-in roles */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Built-in Roles</p>
          <div className="space-y-1.5">
            {[
              { code: "supervisor", name: "Supervisor", color: "#f59e0b", desc: "Team leader, oversees operations" },
              { code: "engineer", name: "Engineer", color: "#3b82f6", desc: "Technical specialist, performs fieldwork" },
            ].map(r => (
              <div key={r.code} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color }} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">{r.name}</span>
                  <p className="text-[10px] text-slate-400">{r.desc}</p>
                </div>
                <Badge variant="outline" className="text-[9px]">Built-in</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Custom roles */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Custom Roles</p>
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading...</p>
          ) : roles.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No custom roles yet. Add one below.</p>
          ) : (
            <div className="space-y-1.5">
              {roles.map(r => (
                <div key={r.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${r.is_active !== false ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color || "#94a3b8" }} />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700">{r.name}</span>
                    <p className="text-[10px] text-slate-400 font-mono">{r.code}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(r)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${r.is_active !== false ? "bg-emerald-100 text-emerald-700 hover:bg-amber-100 hover:text-amber-700" : "bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"}`}
                  >
                    {r.is_active !== false ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new role */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600">Add New Role</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={newRole.name}
                placeholder="e.g. Helper"
                onChange={e => setNewRole(p => ({ ...p, name: e.target.value, code: autoCode(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="text-xs">Code (auto)</Label>
              <Input
                value={newRole.code}
                placeholder="e.g. helper"
                onChange={e => setNewRole(p => ({ ...p, code: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={newRole.description} placeholder="Optional" onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {DEFAULT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewRole(p => ({ ...p, color: c }))}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${newRole.color === c ? "ring-2 ring-offset-1 ring-slate-400 scale-110" : ""}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <Button
            className="w-full"
            size="sm"
            onClick={handleAdd}
            disabled={saving || !newRole.name || !newRole.code}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
            Add Role
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}