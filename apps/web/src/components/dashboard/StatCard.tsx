'use client';

import type { ComponentType, SVGProps } from "react";
import { Card } from "@/components/ui/card";

interface Props {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  trend?: string;
  trendUp?: boolean;
  accentColor?: "blue" | "green" | "orange" | "red" | "purple" | "cyan";
}

export default function StatCard({ label, value, subtitle, icon: Icon, trend, trendUp, accentColor = "blue" }: Props) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <Card className="p-5 bg-white border-slate-200/80 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colors[accentColor]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
