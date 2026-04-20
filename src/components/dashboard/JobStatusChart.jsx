import React from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_COLORS = {
  created: "#94a3b8",
  assigned: "#60a5fa",
  accepted: "#818cf8",
  traveling: "#f59e0b",
  on_site: "#fb923c",
  working: "#a78bfa",
  completed: "#34d399",
  cancelled: "#f87171",
};

export default function JobStatusChart({ workOrders }) {
  const statusCounts = workOrders.reduce((acc, wo) => {
    acc[wo.status] = (acc[wo.status] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <Card className="p-5 bg-white border-slate-200/80">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Job Status Distribution</h3>
        <p className="text-sm text-slate-400 text-center py-8">No data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-white border-slate-200/80">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Job Status Distribution</h3>
      <div className="flex items-center gap-4">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {data.map(({ name, value }) => (
            <div key={name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[name] || "#94a3b8" }} />
              <span className="text-xs text-slate-600 capitalize">{name.replace("_", " ")}</span>
              <span className="text-xs font-semibold text-slate-800 ml-auto">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}