import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users, UserPlus, Shield, Search, Mail, Crown, User as UserIcon,
  Loader2, Check, X, Settings2, Lock
} from "lucide-react";
import {
  PAGE_LIST, ACTIONS, DEFAULT_ROLE_PERMISSIONS,
  loadPermissions, savePermissions
} from "@/components/permissions";

const ROLES = [
  { value: "admin", label: "Admin", color: "bg-red-100 text-red-700", icon: Crown, description: "Full access — cannot be restricted" },
  { value: "manager", label: "Manager", color: "bg-purple-100 text-purple-700", icon: Shield, description: "Operations & reports" },
  { value: "dispatcher", label: "Dispatcher", color: "bg-blue-100 text-blue-700", icon: Shield, description: "Dispatch & scheduling" },
  { value: "viewer", label: "Viewer", color: "bg-slate-100 text-slate-600", icon: UserIcon, description: "Read-only access" },
  { value: "user", label: "User", color: "bg-green-100 text-green-700", icon: UserIcon, description: "Basic access" },
];

const PAGE_LABELS = {
  Dashboard: "Dashboard",
  WorkOrders: "Work Orders",
  Dispatch: "Dispatch",
  Technicians: "Technicians",
  Schedule: "Schedule",
  Zones: "Zones",
  Customers: "Customers",
  Sites: "Sites",
  Analytics: "Analytics",
  MasterData: "Master Data",
  Agents: "AI Agents",
  UserManagement: "User Management",
  Notifications: "Notifications",
};

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

function RoleBadge({ role }) {
  const r = ROLES.find(x => x.value === role) || ROLES[ROLES.length - 1];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${r.color}`}>
      <r.icon className="w-3 h-3" />
      {r.label}
    </span>
  );
}

function CheckCell({ checked, locked, onChange }) {
  if (locked) return (
    <div className="flex items-center justify-center">
      <Check className="w-4 h-4 text-slate-300" />
    </div>
  );
  return (
    <button
      onClick={onChange}
      className={`w-6 h-6 rounded flex items-center justify-center border transition-colors mx-auto
        ${checked ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-slate-300 text-transparent hover:border-blue-400"}`}
    >
      <Check className="w-3.5 h-3.5" />
    </button>
  );
}

export default function UserManagement() {
  const [tab, setTab] = useState("users"); // "users" | "permissions"
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState(() => loadPermissions());
  const [permDirty, setPermDirty] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("full_name", 200),
  });

  const filteredUsers = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?.id && newRole !== "admin") {
      toast.error("You cannot remove your own admin role");
      return;
    }
    setUpdatingId(userId);
    await base44.entities.User.update(userId, { role: newRole });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    toast.success("Role updated");
    setUpdatingId(null);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteRole("user");
    setInviting(false);
  };

  // Toggle page access for a role
  const togglePage = (role, page) => {
    const updated = JSON.parse(JSON.stringify(permissions));
    const pages = updated[role].pages || [];
    if (pages.includes(page)) {
      updated[role].pages = pages.filter(p => p !== page);
    } else {
      updated[role].pages = [...pages, page];
    }
    setPermissions(updated);
    setPermDirty(true);
  };

  // Toggle action for a role
  const toggleAction = (role, action) => {
    const updated = JSON.parse(JSON.stringify(permissions));
    updated[role].actions[action] = !updated[role].actions[action];
    setPermissions(updated);
    setPermDirty(true);
  };

  const handleSavePermissions = () => {
    savePermissions(permissions);
    setPermDirty(false);
    toast.success("Permissions saved — changes apply on next page visit");
  };

  const handleResetPermissions = () => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    setPermissions(fresh);
    savePermissions(fresh);
    setPermDirty(false);
    toast.success("Permissions reset to default");
  };

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r.value] = users.filter(u => u.role === r.value).length;
    return acc;
  }, {});

  const editableRoles = ROLES.filter(r => r.value !== "admin");

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage users, roles, and page permissions</p>
        </div>
        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setTab("users")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "users" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1.5" />Users
          </button>
          <button
            onClick={() => setTab("permissions")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "permissions" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Settings2 className="w-3.5 h-3.5 inline mr-1.5" />Permissions
          </button>
        </div>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ROLES.map(role => (
          <Card key={role.value} className="p-3 border border-slate-200">
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium mb-2 ${role.color}`}>
              <role.icon className="w-3 h-3" />
              {role.label}
            </div>
            <p className="text-2xl font-bold text-slate-800">{roleCounts[role.value] || 0}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{role.description}</p>
          </Card>
        ))}
      </div>

      {tab === "users" && (
        <>
          {/* Invite */}
          <Card className="border border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-500" />
                Invite New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleInvite()}
                    placeholder="user@example.com" className="pl-9" />
                </div>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        <span className="flex items-center gap-2"><r.icon className="w-3.5 h-3.5" />{r.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="shrink-0">
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Send Invite
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User list */}
          <Card className="border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  All Users ({users.length})
                </CardTitle>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search users..." className="pl-8 h-8 text-sm" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredUsers.map(user => {
                    const isMe = user.id === currentUser?.id;
                    const isUpdating = updatingId === user.id;
                    return (
                      <div key={user.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${isMe ? "bg-blue-50/40" : ""}`}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-white">
                            {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-slate-800 truncate">{user.full_name || "—"}</p>
                            {isMe && <Badge className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0">You</Badge>}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          ) : (
                            <Select value={user.role || "user"} onValueChange={v => handleRoleChange(user.id, v)}
                              disabled={isMe && user.role === "admin"}>
                              <SelectTrigger className="h-8 w-[140px] text-xs border-slate-200">
                                <SelectValue><RoleBadge role={user.role || "user"} /></SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map(r => (
                                  <SelectItem key={r.value} value={r.value}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{r.label}</span>
                                      <span className="text-[11px] text-slate-400">{r.description}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === "permissions" && (
        <>
          {/* Actions permission table */}
          <Card className="border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-500" />
                  Action Permissions (per Role)
                </CardTitle>
                <p className="text-xs text-slate-400">Controls Create / Edit / Delete across all pages</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium w-32">Role</th>
                      {ACTIONS.map(a => (
                        <th key={a} className="text-center py-2 px-3 text-xs text-slate-500 font-medium w-20">
                          {ACTION_LABELS[a]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Admin row — locked */}
                    <tr className="bg-slate-50/50">
                      <td className="py-2.5 pr-4">
                        <RoleBadge role="admin" />
                      </td>
                      {ACTIONS.map(a => (
                        <td key={a} className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-red-400" />
                          </div>
                        </td>
                      ))}
                    </tr>
                    {editableRoles.map(role => (
                      <tr key={role.value}>
                        <td className="py-2.5 pr-4"><RoleBadge role={role.value} /></td>
                        {ACTIONS.map(action => (
                          <td key={action} className="py-2.5 px-3">
                            <CheckCell
                              checked={permissions[role.value]?.actions?.[action] ?? false}
                              onChange={() => toggleAction(role.value, action)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Page access table */}
          <Card className="border border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-500" />
                Page Access (per Role)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium min-w-[140px]">Page</th>
                      {ROLES.map(role => (
                        <th key={role.value} className="text-center py-2 px-2 text-xs font-medium min-w-[80px]">
                          <RoleBadge role={role.value} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {PAGE_LIST.map(page => (
                      <tr key={page} className="hover:bg-slate-50/50">
                        <td className="py-2 pr-4 text-sm text-slate-700 font-medium">{PAGE_LABELS[page] || page}</td>
                        {/* Admin — always locked */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-red-400" />
                          </div>
                        </td>
                        {editableRoles.map(role => (
                          <td key={role.value} className="py-2 px-2">
                            <CheckCell
                              checked={permissions[role.value]?.pages?.includes(page) ?? false}
                              onChange={() => togglePage(role.value, page)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Save/Reset bar */}
          <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${permDirty ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
            <p className="text-sm text-slate-600">
              {permDirty
                ? "⚠️ You have unsaved changes — save to apply permissions"
                : "✅ Permissions are saved and active"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetPermissions}>Reset to Default</Button>
              <Button size="sm" onClick={handleSavePermissions} disabled={!permDirty}
                className="bg-blue-600 hover:bg-blue-700">
                Save Permissions
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}