import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, MapPin, Users, ClipboardList, Trash2, Pencil, Loader2, PenLine, Save, X, Map, Bot, ChevronRight } from "lucide-react";
import ZoneMap from "../components/zones/ZoneMap";

const ZONE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

const EMPTY_FORM = { name: "", code: "", description: "", color: ZONE_COLORS[0], provinces: [], agent_id: "" };

export default function Zones() {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [provinceInput, setProvinceInput] = useState("");
  const [drawingZone, setDrawingZone] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const queryClient = useQueryClient();

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.Zone.list("-created_date", 100),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.Technician.list("-created_date", 500),
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => base44.entities.WorkOrder.list("-created_date", 500),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => base44.entities.AIAgent.list("name", 100),
  });

  const openCreate = () => {
    setEditData(null);
    setForm({ ...EMPTY_FORM, color: ZONE_COLORS[zones.length % ZONE_COLORS.length] });
    setShowForm(true);
  };

  const openEdit = (zone) => {
    setEditData(zone);
    setForm({
      name: zone.name || "",
      code: zone.code || "",
      description: zone.description || "",
      color: zone.color || ZONE_COLORS[0],
      provinces: zone.provinces || [],
      polygon: zone.polygon || [],
      agent_id: zone.agent_id || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error("Name and Code are required");
      return;
    }
    setSaving(true);
    try {
      if (form.agent_id) {
        const agent = agents.find(a => a.id === form.agent_id);
        if (agent) {
          const zoneId = editData?.id;
          const existingIds = agent.assigned_zone_ids || [];
          const existingNames = agent.assigned_zone_names || [];
          const newIds = zoneId ? Array.from(new Set([...existingIds, zoneId])) : existingIds;
          const newNames = Array.from(new Set([...existingNames, form.name]));
          await base44.entities.AIAgent.update(form.agent_id, { assigned_zone_ids: newIds, assigned_zone_names: newNames });
        }
      }
      if (editData?.id) {
        await base44.entities.Zone.update(editData.id, form);
        toast.success("Zone updated");
      } else {
        await base44.entities.Zone.create(form);
        toast.success("Zone created");
      }
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.Zone.delete(id);
    queryClient.invalidateQueries({ queryKey: ["zones"] });
    toast.success("Zone deleted");
  };

  const addProvince = () => {
    if (provinceInput.trim() && !form.provinces.includes(provinceInput.trim())) {
      setForm(prev => ({ ...prev, provinces: [...prev.provinces, provinceInput.trim()] }));
      setProvinceInput("");
    }
  };

  const removeProvince = (p) => setForm(prev => ({ ...prev, provinces: prev.provinces.filter(x => x !== p) }));

  const startDrawing = (zone) => setDrawingZone(zone);

  const handleMapSave = async (latlngs) => {
    if (!drawingZone) return;
    setSaving(true);
    await base44.entities.Zone.update(drawingZone.id, { polygon: latlngs || [] });
    toast.success(`Polygon saved for ${drawingZone.name}`);
    setDrawingZone(null);
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ["zones"] });
  };

  const triggerMapSave = () => window.dispatchEvent(new Event("zone-map-save"));
  const triggerMapCancel = () => {
    window.dispatchEvent(new Event("zone-map-cancel"));
    setDrawingZone(null);
  };

  // ---- FORM PANEL (side panel, not dialog) ----
  if (showForm) {
    return (
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Form panel */}
        <div className="w-full max-w-md shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden shadow-lg z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
            <div>
              <h2 className="font-semibold text-slate-800">{editData ? "Edit Zone" : "New Zone"}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{editData ? `Editing: ${editData.name}` : "Create a new service zone"}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Name & Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1 block">Zone Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. North Bangkok"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1 block">Code *</Label>
                <Input
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. BKK-N"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Description</Label>
              <Input
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>

            {/* Color */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-2 block">Zone Color</Label>
              <div className="flex gap-2.5 flex-wrap">
                {ZONE_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm(prev => ({ ...prev, color: c }))}
                  />
                ))}
              </div>
            </div>

            {/* AI Agent */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Assigned AI Agent</Label>
              <Select
                value={form.agent_id || "__none__"}
                onValueChange={v => setForm(prev => ({ ...prev, agent_id: v === "__none__" ? "" : v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No agent assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— No Agent —</SelectItem>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-3 h-3 text-blue-500 inline" /> {a.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {agents.length === 0 && (
                <p className="text-[11px] text-slate-400 mt-1">No agents yet — create one on the <a href="/Agents" className="text-blue-500 underline">Agents page</a></p>
              )}
            </div>

            {/* Provinces */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Provinces / Areas</Label>
              <div className="flex gap-2">
                <Input
                  value={provinceInput}
                  onChange={e => setProvinceInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addProvince())}
                  placeholder="Type and press Enter"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addProvince}>Add</Button>
              </div>
              {form.provinces.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.provinces.map(p => (
                    <Badge
                      key={p}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                      onClick={() => removeProvince(p)}
                    >
                      {p} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name || !form.code}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? "Update Zone" : "Create Zone"}
            </Button>
          </div>
        </div>

        {/* Map on the right */}
        <div className="flex-1 relative">
          <ZoneMap zones={zones} editingZone={null} onPolygonSaved={() => {}} onCancel={() => {}} />
        </div>
      </div>
    );
  }

  // ---- MAIN VIEW ----
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">

      {/* MAP — top on mobile, right on desktop */}
      <div className="relative h-[40vh] lg:h-auto lg:flex-1 order-first lg:order-last shrink-0">
        {drawingZone && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-2.5 max-w-[90vw]">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: drawingZone.color || "#3b82f6" }} />
            <span className="text-sm font-semibold text-slate-700 truncate">{drawingZone.name}</span>
            <span className="hidden sm:block text-xs text-slate-400 border-l border-slate-200 pl-2 ml-1">Use polygon tool on map</span>
            <Button size="sm" className="ml-2 bg-blue-600 hover:bg-blue-700 h-7 text-xs shrink-0" onClick={triggerMapSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Save
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={triggerMapCancel}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        {!drawingZone && zones.every(z => !z.polygon?.length) && zones.length > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
            Click <PenLine className="w-3 h-3 inline mx-1 text-blue-500" /> on a zone to draw its boundary
          </div>
        )}
        <ZoneMap
          zones={zones}
          editingZone={drawingZone}
          onPolygonSaved={handleMapSave}
          onCancel={() => setDrawingZone(null)}
        />
      </div>

      {/* ZONE LIST — below map on mobile, left panel on desktop */}
      <div className="w-full lg:w-[360px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-r border-slate-200 bg-white overflow-hidden order-last lg:order-first">
        {/* Toolbar */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
          <p className="text-sm font-semibold text-slate-700">{zones.length} Zones</p>
          <Button size="sm" className="h-8" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Zone
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : zones.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No zones yet</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Create First Zone
              </Button>
            </div>
          ) : (
            zones.map(zone => {
              const techCount = technicians.filter(t => t.zone_name === zone.name).length;
              const jobCount = workOrders.filter(wo => wo.zone_name === zone.name).length;
              const isDrawing = drawingZone?.id === zone.id;
              const assignedAgent = agents.find(a => a.id === zone.agent_id);

              return (
                <Card
                  key={zone.id}
                  className={`p-3.5 bg-white border transition-all ${isDrawing ? "ring-2 ring-blue-500 shadow-md border-blue-200" : "border-slate-200 hover:shadow-sm hover:border-slate-300"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2.5 h-10 rounded-full shrink-0" style={{ backgroundColor: zone.color || "#3b82f6" }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{zone.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{zone.code}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(zone)} title="Edit zone info">
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startDrawing(zone)} title="Draw polygon">
                        <PenLine className={`w-3.5 h-3.5 ${isDrawing ? "text-blue-600" : "text-slate-400 hover:text-blue-500"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(zone.id)} title="Delete zone">
                        <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {zone.description && (
                    <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1 ml-5">{zone.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2.5 ml-5">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {techCount} techs
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" /> {jobCount} jobs
                    </span>
                    {zone.polygon?.length > 0 ? (
                      <Badge className="text-[9px] bg-emerald-100 text-emerald-700 ml-auto px-1.5">
                        <Map className="w-2.5 h-2.5 mr-0.5" /> {zone.polygon.length} pts
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] text-slate-400 ml-auto px-1.5">No polygon</Badge>
                    )}
                  </div>

                  {assignedAgent && (
                    <div className="flex items-center gap-1.5 mt-2 ml-5 pt-2 border-t border-slate-100">
                      <Bot className="w-3 h-3 text-blue-500" />
                      <span className="text-[11px] text-blue-600 font-medium truncate">{assignedAgent.name}</span>
                      <Badge className={`text-[9px] ml-auto ${assignedAgent.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {assignedAgent.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  )}

                  {zone.provinces?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-5">
                      {zone.provinces.slice(0, 4).map(p => (
                        <Badge key={p} variant="outline" className="text-[9px] px-1.5">{p}</Badge>
                      ))}
                      {zone.provinces.length > 4 && (
                        <Badge variant="outline" className="text-[9px] px-1.5">+{zone.provinces.length - 4}</Badge>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}