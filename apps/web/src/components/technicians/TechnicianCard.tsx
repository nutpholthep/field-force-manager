'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Gauge, Shield } from "lucide-react";
import type { Technician } from "@ffm/shared";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  on_leave: "bg-amber-100 text-amber-700",
  suspended: "bg-red-100 text-red-700",
};

const availColors: Record<string, string> = {
  available: "bg-green-500",
  busy: "bg-amber-500",
  offline: "bg-slate-400",
  break: "bg-blue-500",
};

interface Props {
  tech: Technician;
  onClick: (tech: Technician) => void;
}

export default function TechnicianCard({ tech, onClick }: Props) {
  return (
    <Card
      className="p-4 bg-white border-slate-200/80 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onClick(tech)}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-600">
              {tech.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${availColors[tech.availability as string] || availColors.offline}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{tech.full_name}</p>
            <Badge className={`text-[9px] ${statusColors[tech.status] || statusColors.inactive}`}>{tech.status}</Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono">{tech.technician_code}</p>
          {tech.zone_name && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">{tech.zone_name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
          <Star className="w-3 h-3 text-amber-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{tech.customer_rating?.toFixed(1) || "—"}</p>
          <p className="text-[9px] text-slate-400">Rating</p>
        </div>
        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
          <Gauge className="w-3 h-3 text-blue-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{tech.performance_score || "—"}</p>
          <p className="text-[9px] text-slate-400">Score</p>
        </div>
        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
          <Shield className="w-3 h-3 text-emerald-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{tech.sla_compliance_rate ? `${tech.sla_compliance_rate}%` : "—"}</p>
          <p className="text-[9px] text-slate-400">SLA</p>
        </div>
      </div>

      {tech.skills && tech.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tech.skills.slice(0, 3).map((s: string) => (
            <Badge key={s} variant="outline" className="text-[9px] border-slate-200 text-slate-500">{s}</Badge>
          ))}
          {tech.skills.length > 3 && (
            <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-400">+{tech.skills.length - 3}</Badge>
          )}
        </div>
      )}
    </Card>
  );
}
