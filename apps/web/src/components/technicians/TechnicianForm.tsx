'use client';

import { useState } from "react";
import { entities } from "@/lib/entity-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Skill, Technician, Zone } from "@ffm/shared";

type TechnicianFormData = Partial<Technician> & {
  technician_code: string;
  full_name: string;
  email: string;
  phone: string;
  status: Technician["status"];
  availability: string;
  zone_name: string;
  skills: string[];
  certifications: string[];
  max_daily_jobs: number;
  working_hours_start: string;
  working_hours_end: string;
  hourly_rate: number;
  home_latitude: number | null;
  home_longitude: number | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editData?: Technician | null;
}

export default function TechnicianForm({ open, onClose, onSaved, editData }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TechnicianFormData>((editData as TechnicianFormData) || {
    technician_code: "",
    full_name: "",
    email: "",
    phone: "",
    status: "active",
    availability: "available",
    zone_name: "",
    skills: [],
    certifications: [],
    max_daily_jobs: 6,
    working_hours_start: "08:00",
    working_hours_end: "17:00",
    hourly_rate: 0,
    home_latitude: null,
    home_longitude: null,
  });

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ["zones"],
    queryFn: () => entities.Zone.list(),
  });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ["skills"],
    queryFn: () => entities.Skill.list("name", 500),
  });

  const handleSave = async () => {
    setSaving(true);
    const code = form.technician_code || `TECH-${Date.now().toString(36).toUpperCase()}`;
    const data = { ...form, technician_code: code };

    if (editData?.id) {
      await entities.Technician.update(editData.id, data);
    } else {
      await entities.Technician.create(data);
    }
    setSaving(false);
    onSaved();
  };

  const update = <K extends keyof TechnicianFormData>(field: K, value: TechnicianFormData[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...(prev.skills || []), skill]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Technician" : "Add Technician"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={form.technician_code} onChange={e => update("technician_code", e.target.value)} placeholder="Auto-generate" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email || ""} onChange={e => update("email", e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone || ""} onChange={e => update("phone", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update("status", v as Technician["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zone</Label>
              <Select value={form.zone_name || ""} onValueChange={v => update("zone_name", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {zones.map(z => (
                    <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Max Jobs/Day</Label>
              <Input type="number" value={form.max_daily_jobs} onChange={e => update("max_daily_jobs", parseInt(e.target.value))} />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={form.working_hours_start || "08:00"} onChange={e => update("working_hours_start", e.target.value)} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={form.working_hours_end || "17:00"} onChange={e => update("working_hours_end", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Hourly Rate</Label>
            <Input type="number" min="0" step="0.01" value={form.hourly_rate || 0} onChange={e => update("hourly_rate", parseFloat(e.target.value))} />
          </div>
          <div>
            <Label className="mb-2 block">Skills</Label>
            {skills.length === 0 ? (
              <p className="text-xs text-slate-400">No skills defined. Add skills in Master Data first.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skills.map(skill => (
                  <Badge
                    key={skill.id}
                    variant={form.skills?.includes(skill.name) ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${form.skills?.includes(skill.name) ? "bg-blue-600" : "border-slate-300 text-slate-500 hover:border-blue-400"}`}
                    onClick={() => toggleSkill(skill.name)}
                  >
                    {skill.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.full_name}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editData ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
