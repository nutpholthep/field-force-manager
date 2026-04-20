import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, Users, Clock, DollarSign, Target, Award } from "lucide-react";
import AttendanceSummary from "../components/analytics/AttendanceSummary";
import { Skeleton } from "@/components/ui/skeleton";
import moment from "moment";
import StatCard from "../components/dashboard/StatCard";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function Analytics() {
  const [tab, setTab] = useState("attendance");

  const { data: workOrders = [], isLoading: woLoading } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => base44.entities.WorkOrder.list("-created_date", 500),
  });

  const { data: technicians = [], isLoading: techLoading } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.Technician.list("-created_date", 500),
  });

  const isLoading = woLoading || techLoading;

  // Overview metrics
  const completed = workOrders.filter(wo => wo.status === "completed");
  const avgDuration = completed.length > 0
    ? (completed.reduce((s, wo) => s + (wo.actual_duration_hrs || wo.estimated_duration_hrs || 0), 0) / completed.length).toFixed(1)
    : 0;
  const totalCost = completed.reduce((s, wo) => s + (wo.total_cost || 0), 0);
  const slaCompliant = completed.filter(wo => wo.sla_risk !== "high").length;
  const slaRate = completed.length > 0 ? Math.round((slaCompliant / completed.length) * 100) : 0;

  // Jobs by service type
  const byServiceType = useMemo(() => {
    const counts = {};
    workOrders.forEach(wo => {
      const type = wo.service_type || "other";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [workOrders]);

  // Jobs over time (last 12 weeks)
  const jobsOverTime = useMemo(() => {
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = moment().subtract(i, "weeks").startOf("isoWeek");
      const weekEnd = weekStart.clone().endOf("isoWeek");
      const count = workOrders.filter(wo => {
        const d = moment(wo.created_date);
        return d.isBetween(weekStart, weekEnd, null, "[]");
      }).length;
      weeks.push({ week: weekStart.format("MMM D"), jobs: count });
    }
    return weeks;
  }, [workOrders]);

  // Top technicians
  const topTechnicians = useMemo(() => {
    return [...technicians]
      .filter(t => t.performance_score != null)
      .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
      .slice(0, 10)
      .map(t => ({
        name: t.full_name,
        score: t.performance_score || 0,
        sla: t.sla_compliance_rate || 0,
        rating: t.customer_rating || 0,
        jobs: t.jobs_completed_total || 0,
      }));
  }, [technicians]);

  // Zone analysis
  const zoneAnalysis = useMemo(() => {
    const zones = {};
    workOrders.forEach(wo => {
      const zone = wo.zone_name || "Unassigned";
      if (!zones[zone]) zones[zone] = { name: zone, total: 0, completed: 0, avgDuration: 0 };
      zones[zone].total++;
      if (wo.status === "completed") {
        zones[zone].completed++;
        zones[zone].avgDuration += (wo.actual_duration_hrs || wo.estimated_duration_hrs || 0);
      }
    });
    return Object.values(zones).map(z => ({
      ...z,
      avgDuration: z.completed > 0 ? (z.avgDuration / z.completed).toFixed(1) : 0,
      completionRate: z.total > 0 ? Math.round((z.completed / z.total) * 100) : 0,
    }));
  }, [workOrders]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Completion Rate" value={`${completed.length > 0 ? Math.round((completed.length / workOrders.length) * 100) : 0}%`} icon={Target} accentColor="green" />
        <StatCard label="Avg Duration" value={`${avgDuration}h`} icon={Clock} accentColor="blue" />
        <StatCard label="SLA Compliance" value={`${slaRate}%`} icon={Award} accentColor="purple" />
        <StatCard label="Total Cost" value={`$${totalCost.toLocaleString()}`} icon={DollarSign} accentColor="orange" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="attendance">🟢 Attendance Today</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "attendance" && <AttendanceSummary />}

      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Jobs over time */}
          <Card className="p-5 bg-white">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Jobs Created (Last 12 Weeks)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={jobsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip />
                <Bar dataKey="jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* By service type */}
          <Card className="p-5 bg-white">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Jobs by Service Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byServiceType} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                  {byServiceType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === "technicians" && (
        <Card className="p-5 bg-white">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Performing Technicians</h3>
          {topTechnicians.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No performance data available</p>
          ) : (
            <div className="space-y-3">
              {topTechnicians.map((t, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{t.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400">{t.jobs} jobs</span>
                      <span className="text-xs text-slate-400">SLA: {t.sla}%</span>
                      <span className="text-xs text-slate-400">Rating: {t.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{t.score}</p>
                    <p className="text-[10px] text-slate-400">Score</p>
                  </div>
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "zones" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zoneAnalysis.map(z => (
            <Card key={z.name} className="p-5 bg-white">
              <h4 className="text-sm font-semibold text-slate-800">{z.name}</h4>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">{z.total}</p>
                  <p className="text-[10px] text-slate-400">Total Jobs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">{z.completionRate}%</p>
                  <p className="text-[10px] text-slate-400">Completion Rate</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{z.avgDuration}h</p>
                  <p className="text-[10px] text-slate-400">Avg Duration</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{z.completed}</p>
                  <p className="text-[10px] text-slate-400">Completed</p>
                </div>
              </div>
            </Card>
          ))}
          {zoneAnalysis.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">No zone data available</div>
          )}
        </div>
      )}
    </div>
  );
}