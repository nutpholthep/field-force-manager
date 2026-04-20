import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Link2, Unlink, User } from "lucide-react";
import SkillCertPanel from "./SkillCertPanel";
import UserLinkDialog from "./UserLinkDialog";

export default function MemberForm({ open, onClose, onSaved, editData, roles = [] }) {
  const [saving, setSaving] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [form, setForm] = useState(editData || {
    technician_code: "",
    full_name: "",
    email: "",
    phone: "",
    status: "active",
    availability: "available",
    team_role: "",
    team_role_name: "",
    team_id: "",
    team_name: "",
    zone_name: "",
    skills: [],
    max_daily_jobs: 6,
    working_hours_start: "08:00",
    working_hours_end: "17:00",
    hourly_rate: 0,
    linked_user_id: "",
    linked_user_email: "",
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.Zone.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("name", 100),
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleRoleChange = (code) => {
    const role = roles.find(r => r.code === code);
    update("team_role", code);
    update("team_role_name", role?.name || code);
  };

  const handleTeamChange = (id) => {
    const team = teams.find(t => t.id === id);
    update("team_id", id);
    update("team_name", team?.name || "");
  };

  const handleLinkUser = (user) => {
    setForm(prev => ({
      ...prev,
      linked_user_id: user.id,
      linked_user_email: user.email,
      full_name: prev.full_name || user.full_name || prev.full_name,
      email: prev.email || user.email,
    }));
    setShowLink(false);
  };

  const handleUnlinkUser = () => {
    setForm(prev => ({ ...prev, linked_user_id: "", linked_user_email: "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    const code = form.technician_code || `MBR-${Date.now().toString(36).toUpperCase()}`;
    const data = { ...form, technician_code: code };
    if (editData?.id) {
      await base44.entities.Technician.update(editData.id, data);
    } else {
      await base44.entities.Technician.create(data);
    }
    setSaving(false);
    onSaved();
  };

  const isEdit = !!editData?.id;
  const activeRoles = roles.filter(r => r.is_active !== false);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Member" : "Add Team Member"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info">
            <TabsList className="mb-4">
              <TabsTrigger value="info">Member Info</TabsTrigger>
              {isEdit && <TabsTrigger value="skills">Skills & Certifications</TabsTrigger>}
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-0">
              {/* User Link Section */}
              <div className={`rounded-xl border p-3 ${form.linked_user_id ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Linked App User
                    </p>
                    {form.linked_user_email ? (
                      <p className="text-sm text-blue-700 font-medium mt-0.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {form.linked_user_email}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">No user linked — this slot is unoccupied</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {form.linked_user_email && (
                      <Button variant="outline" size="sm" onClick={handleUnlinkUser} className="text-red-500 border-red-200 hover:bg-red-50">
                        <Unlink className="w-3.5 h-3.5 mr-1" /> Unlink
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowLink(true)}>
                      <Link2 className="w-3.5 h-3.5 mr-1" /> {form.linked_user_email ? "Change" : "Link User"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Full Name <span className="text-red-500">*</span></Label>
                  <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} />
                </div>
                <div>
                  <Label>Member Code</Label>
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

              {/* Role & Team */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Team Assignment</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Role</Label>
                    <Select value={form.team_role || ""} onValueChange={handleRoleChange}>
                      <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="engineer">Engineer</SelectItem>
                        {activeRoles.filter(r => r.code !== "supervisor" && r.code !== "engineer").map(r => (
                          <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Team</Label>
                    <Select value={form.team_id || ""} onValueChange={handleTeamChange}>
                      <SelectTrigger><SelectValue placeholder="Select team..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>— None —</SelectItem>
                        {teams.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => update("status", v)}>
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
              </div>

              {/* Work settings */}
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
            </TabsContent>

            {isEdit && (
              <TabsContent value="skills" className="mt-0">
                <SkillCertPanel technicianId={editData.id} technicianName={editData.full_name} />
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.full_name}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Update" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showLink && (
        <UserLinkDialog
          open={showLink}
          onClose={() => setShowLink(false)}
          onSelect={handleLinkUser}
          currentLinkedId={form.linked_user_id}
        />
      )}
    </>
  );
}