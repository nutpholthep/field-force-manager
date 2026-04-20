'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import moment from "moment";
import type { WorkOrder } from "@ffm/shared";

const riskColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

interface Props {
  workOrders: WorkOrder[];
}

export default function SLARiskTable({ workOrders }: Props) {
  const atRisk = workOrders
    .filter(wo => wo.sla_risk === "high" || wo.sla_risk === "medium")
    .filter(wo => wo.status !== "completed" && wo.status !== "cancelled")
    .sort((a, b) => (a.sla_risk === "high" ? -1 : 1))
    .slice(0, 6);

  return (
    <Card className="p-5 bg-white border-slate-200/80">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-700">SLA Risk Alerts</h3>
      </div>
      {atRisk.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No SLA risks detected</p>
      ) : (
        <div className="space-y-2.5">
          {atRisk.map(wo => (
            <div key={wo.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{wo.order_number}</p>
                <p className="text-xs text-slate-500 truncate">{wo.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {wo.sla_due && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {moment(wo.sla_due).fromNow()}
                  </span>
                )}
                <Badge className={`text-[10px] ${riskColors[wo.sla_risk as string]}`}>
                  {wo.sla_risk}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
