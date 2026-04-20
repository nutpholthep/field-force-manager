import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserLinkDialog({ open, onClose, onSelect, currentLinkedId }) {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("full_name", 200),
  });

  // Also fetch all technicians to know which users are already linked
  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.Technician.list("-created_date", 200),
  });

  const linkedUserIds = new Set(
    technicians.filter(t => t.linked_user_id && t.linked_user_id !== currentLinkedId).map(t => t.linked_user_id)
  );

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link App User to this Slot</DialogTitle>
        </DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No users found</p>
          ) : (
            filtered.map(user => {
              const alreadyLinked = linkedUserIds.has(user.id);
              const isCurrent = user.id === currentLinkedId;
              return (
                <button
                  key={user.id}
                  onClick={() => !alreadyLinked && onSelect(user)}
                  disabled={alreadyLinked}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors
                    ${alreadyLinked
                      ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                      : isCurrent
                        ? "bg-blue-50 border-blue-200 cursor-pointer"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer"
                    }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-white">
                      {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{user.full_name || "—"}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="shrink-0">
                    {isCurrent
                      ? <Badge className="bg-blue-100 text-blue-700 text-[10px]"><Check className="w-2.5 h-2.5 mr-0.5" /> Current</Badge>
                      : alreadyLinked
                        ? <Badge variant="outline" className="text-[10px] text-slate-400">Taken</Badge>
                        : <Badge variant="outline" className="text-[10px]">
                            <span className="text-xs capitalize">{user.role || "user"}</span>
                          </Badge>
                    }
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}