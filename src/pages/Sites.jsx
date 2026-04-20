import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, MapPin, Navigation2 } from "lucide-react";
import MasterToolbar from "../components/master/MasterToolbar";
import { Skeleton } from "@/components/ui/skeleton";
import CoordinatePicker from "@/components/map/CoordinatePicker";

const siteTypeIcons = {
  office: "🏢", warehouse: "🏭", factory: "⚙️", retail: "🏪", residential: "🏠", data_center: "🖥️", outdoor: "🌲"
};

export default function Sites() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCoordPicker, setShowCoordPicker] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", customer_name: "", address: "", zone_name: "",
    site_type: "office", equipment: [], access_instructions: "",
    status: "active", latitude: null, longitude: null,
  });
  const [typeFilter, setTypeFilter] = useState("all");
  const [siteStatusFilter, setSiteStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: () => base44.entities.Site.list("-created_date", 200),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list(),
  });
  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.Zone.list(),
  });

  const filtered = sites.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.customer_name?.toLowerCase().includes(search.toLowerCase()) || s.address?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || s.site_type === typeFilter;
    const matchStatus = siteStatusFilter === "all" || s.status === siteStatusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const openEdit = (s) => {
    setEditData(s);
    setForm({ ...s, latitude: s.latitude || null, longitude: s.longitude || null });
    setShowForm(true);
  };
  const openCreate = () => {
    setEditData(null);
    setForm({ name: "", customer_name: "", address: "", zone_name: "", site_type: "office", equipment: [], access_instructions: "", status: "active", latitude: null, longitude: null });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editData?.id) await base44.entities.Site.update(editData.id, form);
    else await base44.entities.Site.create(form);
    setSaving(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["sites"] });
  };

  const handleDelete = async (id) => {
    await base44.entities.Site.delete(id);
    queryClient.invalidateQueries({ queryKey: ["sites"] });
  };

  const handleImport = async (records) => {
    for (const r of records) await base44.entities.Site.create(r);
    queryClient.invalidateQueries({ queryKey: ["sites"] });
  };

  const handleCoordConfirm = (lat, lng) => {
    setForm(p => ({ ...p, latitude: lat, longitude: lng }));
    setShowCoordPicker(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sites</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} / {sites.length} sites</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <MasterToolbar search={search} onSearch={setSearch} filter={siteStatusFilter} onFilter={setSiteStatusFilter} exportData={filtered} onImport={handleImport} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 text-sm border border-slate-200 rounded-md px-2 bg-white">
            <option value="all">All Types</option>
            {Object.keys(siteTypeIcons).map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Site</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className="p-4 bg-white border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{siteTypeIcons[s.site_type] || "📍"}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.customer_name || "No customer"}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => handleDelete(s.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              {s.address && (
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                  <MapPin className="w-3 h-3" />{s.address}
                </div>
              )}
              {/* Coordinates */}
              <div className="flex items-center gap-1 mt-1 text-xs">
                {s.latitude && s.longitude ? (
                  <span className="text-emerald-600 font-mono flex items-center gap-1">
                    <Navigation2 className="w-3 h-3" />
                    {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-slate-300 flex items-center gap-1">
                    <Navigation2 className="w-3 h-3" /> No coordinates set
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[9px] capitalize">{s.site_type?.replace("_", " ")}</Badge>
                {s.zone_name && <Badge variant="outline" className="text-[9px]">{s.zone_name}</Badge>}
                <Badge className={`text-[9px] ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{s.status}</Badge>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">No sites found</div>
          )}
        </div>
      )}

      {/* Site Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editData ? "Edit Site" : "New Site"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Site Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div>
              <Label>Customer</Label>
              <Select value={form.customer_name || ""} onValueChange={v => setForm(p => ({ ...p, customer_name: v }))}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Address</Label><Input value={form.address || ""} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.site_type || "office"} onValueChange={v => setForm(p => ({ ...p, site_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(siteTypeIcons).map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zone</Label>
                <Select value={form.zone_name || ""} onValueChange={v => setForm(p => ({ ...p, zone_name: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Access Instructions</Label><Input value={form.access_instructions || ""} onChange={e => setForm(p => ({ ...p, access_instructions: e.target.value }))} /></div>

            {/* Coordinates section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Site Coordinates</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setShowCoordPicker(true)}>
                  <Navigation2 className="w-3 h-3" />
                  {form.latitude ? "Edit on Map" : "Set on Map"}
                </Button>
              </div>
              {form.latitude && form.longitude ? (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <Navigation2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-mono text-emerald-700">
                    {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                  </span>
                  <button className="ml-auto text-xs text-slate-400 hover:text-red-400" onClick={() => setForm(p => ({ ...p, latitude: null, longitude: null }))}>✕</button>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 text-center">
                  No coordinates — click "Set on Map" to pin this site
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coordinate Picker Dialog */}
      <Dialog open={showCoordPicker} onOpenChange={() => setShowCoordPicker(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation2 className="w-4 h-4 text-blue-500" />
              Set Site Location
            </DialogTitle>
          </DialogHeader>
          <CoordinatePicker
            lat={form.latitude}
            lng={form.longitude}
            onConfirm={handleCoordConfirm}
            onCancel={() => setShowCoordPicker(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}