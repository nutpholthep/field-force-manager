import React from "react";
import { Card } from "@/components/ui/card";

export default function CapacityGauge({ technicians, workOrders }) {
  const activeTechs = technicians.filter(t => t.status === "active");
  const avgJobDuration = 2; // hours
  const workingHours = 8;

  const totalCapacity = activeTechs.length * workingHours / avgJobDuration;
  const todayJobs = workOrders.filter(wo => {
    const today = new Date().toISOString().split("T")[0];
    return wo.scheduled_date === today && wo.status !== "cancelled";
  }).length;

  const utilization = totalCapacity > 0 ? Math.min((todayJobs / totalCapacity) * 100, 100) : 0;

  const getColor = (pct) => {
    if (pct > 90) return "#ef4444";
    if (pct > 70) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <Card className="p-5 bg-white border-slate-200/80">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Capacity Utilization</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={getColor(utilization)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${utilization * 2.51} 251`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{Math.round(utilization)}%</span>
            <span className="text-[10px] text-slate-400">utilized</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-slate-900">{activeTechs.length}</p>
          <p className="text-[10px] text-slate-400">Technicians</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">{todayJobs}</p>
          <p className="text-[10px] text-slate-400">Today's Jobs</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">{Math.round(totalCapacity)}</p>
          <p className="text-[10px] text-slate-400">Max Capacity</p>
        </div>
      </div>
    </Card>
  );
}