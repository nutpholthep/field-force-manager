import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Users, CheckCircle2, AlertTriangle, Clock, Zap } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import JobStatusChart from "../components/dashboard/JobStatusChart";
import SLARiskTable from "../components/dashboard/SLARiskTable";
import RecentActivity from "../components/dashboard/RecentActivity";
import CapacityGauge from "../components/dashboard/CapacityGauge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: workOrders = [], isLoading: woLoading } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => base44.entities.WorkOrder.list("-created_date", 200),
  });

  const { data: technicians = [], isLoading: techLoading } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.Technician.list("-created_date", 200),
  });

  const isLoading = woLoading || techLoading;

  const totalJobs = workOrders.length;
  const completedJobs = workOrders.filter(wo => wo.status === "completed").length;
  const activeJobs = workOrders.filter(wo => !["completed", "cancelled"].includes(wo.status)).length;
  const highRisk = workOrders.filter(wo => wo.sla_risk === "high" && wo.status !== "completed").length;
  const activeTechs = technicians.filter(t => t.status === "active").length;
  const avgSLA = technicians.length > 0
    ? Math.round(technicians.reduce((s, t) => s + (t.sla_compliance_rate || 0), 0) / technicians.length)
    : 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard label="Total Jobs" value={totalJobs} icon={ClipboardList} accentColor="blue" subtitle="All time" />
        <StatCard label="Active Jobs" value={activeJobs} icon={Clock} accentColor="orange" subtitle="In progress" />
        <StatCard label="Completed" value={completedJobs} icon={CheckCircle2} accentColor="green" trend={`${totalJobs > 0 ? Math.round(completedJobs/totalJobs*100) : 0}% rate`} trendUp />
        <StatCard label="SLA at Risk" value={highRisk} icon={AlertTriangle} accentColor="red" />
        <StatCard label="Technicians" value={`${activeTechs}/${technicians.length}`} icon={Users} accentColor="purple" subtitle="Active / Total" />
        <StatCard label="Avg SLA" value={`${avgSLA}%`} icon={Zap} accentColor="cyan" subtitle="Compliance rate" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <JobStatusChart workOrders={workOrders} />
        <CapacityGauge technicians={technicians} workOrders={workOrders} />
        <SLARiskTable workOrders={workOrders} />
      </div>

      {/* Activity */}
      <RecentActivity workOrders={workOrders} />
    </div>
  );
}