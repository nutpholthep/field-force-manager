import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const statusColors = {
  created: "bg-slate-100 text-slate-600",
  assigned: "bg-blue-100 text-blue-700",
  accepted: "bg-indigo-100 text-indigo-700",
  traveling: "bg-amber-100 text-amber-700",
  on_site: "bg-orange-100 text-orange-700",
  working: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function RecentActivity({ workOrders }) {
  const recent = [...workOrders]
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 8);

  return (
    <Card className="p-5 bg-white border-slate-200/80">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Activity</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {recent.map(wo => (
            <div key={wo.id} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">
                  <span className="font-medium">{wo.order_number}</span>
                  {wo.assigned_technician_name && (
                    <span className="text-slate-400"> → {wo.assigned_technician_name}</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">{moment(wo.updated_date).fromNow()}</p>
              </div>
              <Badge className={`text-[10px] shrink-0 ${statusColors[wo.status] || "bg-slate-100 text-slate-600"}`}>
                {wo.status?.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}