import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, UserCheck, UserX, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

const TODAY = moment().format("YYYY-MM-DD");

const STATUS_META = {
  scheduled:   { label: "Scheduled",   color: "bg-blue-100 text-blue-700" },
  checked_in:  { label: "Checked In",  color: "bg-emerald-100 text-emerald-700" },
  checked_out: { label: "Checked Out", color: "bg-slate-100 text-slate-600" },
  absent:      { label: "Absent",      color: "bg-red-100 text-red-600" },
};

export default function AttendanceSummary() {
  const queryClient = useQueryClient();

  const { data: workOrders = [] } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => base44.entities.WorkOrder.list("-scheduled_date", 500),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.Technician.filter({ status: "active" }, "full_name", 200),
  });

  const { data: attendance = [], refetch } = useQuery({
    queryKey: ["attendance", TODAY],
    queryFn: () => base44.entities.TechnicianAttendance.filter({ date: TODAY }, "technician_name", 200),
    refetchInterval: 30000,
  });

  // Technicians with jobs scheduled today
  const scheduledTodayIds = useMemo(() => {
    const ids = new Set();
    workOrders
      .filter(wo => wo.scheduled_date === TODAY && wo.assigned_technician_id && !["cancelled", "completed"].includes(wo.status))
      .forEach(wo => ids.add(wo.assigned_technician_id));
    return ids;
  }, [workOrders]);

  const scheduledTechs = useMemo(() => {
    return technicians.filter(t => scheduledTodayIds.has(t.id));
  }, [technicians, scheduledTodayIds]);

  // Merge attendance records with scheduled technicians
  const rows = useMemo(() => {
    return scheduledTechs.map(tech => {
      const rec = attendance.find(a => a.technician_id === tech.id);
      const jobCount = workOrders.filter(wo => wo.scheduled_date === TODAY && wo.assigned_technician_id === tech.id).length;
      return { tech, rec, jobCount };
    });
  }, [scheduledTechs, attendance, workOrders]);

  const checkedIn = rows.filter(r => ["checked_in", "checked_out"].includes(r.rec?.status)).length;
  const checkedOut = rows.filter(r => r.rec?.status === "checked_out").length;
  const absent = rows.filter(r => r.rec?.status === "absent").length;

  const ensureRecord = async (tech) => {
    const existing = attendance.find(a => a.technician_id === tech.id);
    if (existing) return existing;
    const created = await base44.entities.TechnicianAttendance.create({
      technician_id: tech.id,
      technician_name: tech.full_name,
      technician_code: tech.technician_code,
      date: TODAY,
      status: "scheduled",
      scheduled_jobs: workOrders.filter(wo => wo.scheduled_date === TODAY && wo.assigned_technician_id === tech.id).length,
    });
    return created;
  };

  const handleCheckIn = async (tech) => {
    const rec = await ensureRecord(tech);
    const now = moment();
    await base44.entities.TechnicianAttendance.update(rec.id, {
      status: "checked_in",
      check_in_time: now.format("HH:mm"),
      check_in_at: now.toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["attendance", TODAY] });
    toast.success(`✅ ${tech.full_name} checked in at ${now.format("HH:mm")}`);
  };

  const handleCheckOut = async (tech) => {
    const rec = attendance.find(a => a.technician_id === tech.id);
    if (!rec) return;
    const now = moment();
    const checkInAt = rec.check_in_at ? moment(rec.check_in_at) : null;
    const workHours = checkInAt ? parseFloat((now.diff(checkInAt, "minutes") / 60).toFixed(2)) : null;
    await base44.entities.TechnicianAttendance.update(rec.id, {
      status: "checked_out",
      check_out_time: now.format("HH:mm"),
      check_out_at: now.toISOString(),
      ...(workHours !== null ? { work_hours: workHours } : {}),
    });
    queryClient.invalidateQueries({ queryKey: ["attendance", TODAY] });
    toast.success(`👋 ${tech.full_name} checked out at ${now.format("HH:mm")}`);
  };

  const handleMarkAbsent = async (tech) => {
    const rec = await ensureRecord(tech);
    await base44.entities.TechnicianAttendance.update(rec.id, { status: "absent" });
    queryClient.invalidateQueries({ queryKey: ["attendance", TODAY] });
    toast.warning(`${tech.full_name} marked as absent`);
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{rows.length}</p>
            <p className="text-xs text-slate-500">Scheduled Today</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
            <LogIn className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{checkedIn}</p>
            <p className="text-xs text-slate-500">Checked In</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-500 rounded-lg flex items-center justify-center">
            <LogOut className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{checkedOut}</p>
            <p className="text-xs text-slate-500">Checked Out</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center">
            <UserX className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{absent}</p>
            <p className="text-xs text-slate-500">Absent</p>
          </div>
        </Card>
      </div>

      {/* Progress bar */}
      {rows.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Today's Attendance Progress</span>
            <span className="text-sm text-slate-500">{checkedIn}/{rows.length} ({Math.round(checkedIn/rows.length*100)}%)</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${rows.length > 0 ? (checkedIn/rows.length)*100 : 0}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Checked In/Out</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Scheduled</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Absent</span>
          </div>
        </Card>
      )}

      {/* Technician rows */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <p className="text-sm font-semibold text-slate-700">Technician Attendance — {moment().format("ddd D MMM YYYY")}</p>
        </div>
        {rows.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No technicians scheduled for today</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map(({ tech, rec, jobCount }) => {
              const status = rec?.status || "scheduled";
              const meta = STATUS_META[status];
              return (
                <div key={tech.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-600">
                      {tech.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{tech.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{tech.team_role_name || tech.team_role || "—"}</span>
                      <span>·</span>
                      <span>{jobCount} job{jobCount !== 1 ? "s" : ""} today</span>
                      {rec?.check_in_time && <span>· In: {rec.check_in_time}</span>}
                      {rec?.check_out_time && <span>· Out: {rec.check_out_time}</span>}
                      {rec?.work_hours && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{rec.work_hours}h</span>}
                    </div>
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${meta.color}`}>{meta.label}</Badge>
                  <div className="flex gap-1.5 shrink-0">
                    {status === "scheduled" && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleCheckIn(tech)}>
                          <LogIn className="w-3 h-3" /> Check In
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-600" onClick={() => handleMarkAbsent(tech)}>
                          <UserX className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    {status === "checked_in" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-slate-600 border-slate-200 hover:bg-slate-50" onClick={() => handleCheckOut(tech)}>
                        <LogOut className="w-3 h-3" /> Check Out
                      </Button>
                    )}
                    {status === "absent" && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-500" onClick={() => handleCheckIn(tech)}>
                        <LogIn className="w-3 h-3" /> Check In
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}