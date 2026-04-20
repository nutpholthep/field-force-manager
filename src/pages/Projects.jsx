import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search, GitBranch, Building2,
  CheckCircle2, Circle, Clock, AlertTriangle, Loader2,
  ArrowRight, Eye, Filter, CalendarDays, ClipboardList, Info
} from "lucide-react";
import moment from "moment";

const STATUS_CONFIG = {
  planning:    { label: "Planning",     color: "bg-slate-100 text-slate-600",   dot: "bg-slate-400" },
  in_progress: { label: "In Progress",  color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  on_hold:     { label: "On Hold",      color: "bg-amber-100 text-amber-700",   dot: "bg-amber-500" },
  completed:   { label: "Completed",    color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  cancelled:   { label: "Cancelled",    color: "bg-red-100 text-red-600",       dot: "bg-red-400" },
};

const PRIORITY_COLOR = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high:     "text-orange-600 bg-orange-50 border-orange-200",
  medium:   "text-blue-600 bg-blue-50 border-blue-200",
  low:      "text-slate-500 bg-slate-50 border-slate-200",
};

function WorkflowProgress({ workflow, completedSteps = [], currentStepId }) {
  if (!workflow?.nodes?.length) return null;
  const nodes = workflow.nodes.filter(n => n.type !== "start" && n.type !== "end");
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {nodes.map((node, i) => {
        const isDone = completedSteps.includes(node.id);
        const isCurrent = node.id === currentStepId;
        return (
          <React.Fragment key={node.id}>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
              isDone    ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
              isCurrent ? "bg-blue-100 text-blue-700 border-blue-300 ring-1 ring-blue-400" :
                          "bg-slate-50 text-slate-400 border-slate-200"
            }`}>
              {isDone ? <CheckCircle2 className="w-3 h-3" /> : isCurrent ? <Clock className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
              {node.label}
            </div>
            {i < nodes.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ProjectCard({ project, workflows, onSelect, onStatusChange }) {
  const wf = workflows.find(w => w.id === project.workflow_id);
  const s = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const nodes = wf?.nodes?.filter(n => n.type !== "start" && n.type !== "end") || [];
  const total = nodes.length;
  const done = (project.completed_steps || []).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isOverdue = project.target_date && project.status !== "completed" && moment(project.target_date).isBefore(moment(), "day");

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(project)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-slate-400 font-mono">{project.project_number}</span>
            <Badge className={`text-[10px] px-1.5 py-0 border ${PRIORITY_COLOR[project.priority]}`}>{project.priority}</Badge>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 truncate">{project.name}</h3>
          {project.customer_name && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">{project.customer_name}</span>
            </div>
          )}
        </div>
        <Badge className={`${s.color} text-xs shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mr-1.5 inline-block`} />
          {s.label}
        </Badge>
      </div>

      {wf && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <GitBranch className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">{wf.name}</span>
            <span className="text-xs text-slate-400 ml-auto">{done}/{total} steps</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {project.current_step_name && (
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3 h-3 text-blue-500" />
          <span className="text-xs text-blue-700 font-medium">Now: {project.current_step_name}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {project.target_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}>
              {isOverdue && <AlertTriangle className="w-3 h-3" />}
              <CalendarDays className="w-3 h-3" /> Due {moment(project.target_date).format("D MMM")}
            </span>
          )}
        </div>
        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-blue-600 hover:bg-blue-50"
          onClick={e => { e.stopPropagation(); onSelect(project); }}>
          <Eye className="w-3 h-3" /> Detail
        </Button>
      </div>
    </div>
  );
}

const WO_STATUS_LABEL = { created: "Created", assigned: "Assigned", accepted: "Accepted", traveling: "Traveling", on_site: "On Site", working: "Working", completed: "Completed", cancelled: "Cancelled" };
const WO_STATUS_COLOR = { created: "bg-slate-100 text-slate-600", assigned: "bg-blue-100 text-blue-700", accepted: "bg-indigo-100 text-indigo-700", traveling: "bg-yellow-100 text-yellow-700", on_site: "bg-orange-100 text-orange-700", working: "bg-purple-100 text-purple-700", completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-600" };

function ProjectDetailModal({ project, workflows, onClose }) {
  const wf = workflows.find(w => w.id === project.workflow_id);
  const nodes = wf?.nodes?.filter(n => n.type === "service") || [];
  const completedSteps = project.completed_steps || [];
  const s = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;

  const { data: workOrders = [] } = useQuery({
    queryKey: ["project-workorders", project.id],
    queryFn: () => base44.entities.WorkOrder.filter({ project_id: project.id }),
    enabled: !!project.id,
  });

  const total = nodes.length;
  const done = completedSteps.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <GitBranch className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="truncate">{project.name}</span>
            <span className="text-xs text-slate-400 font-mono">{project.project_number}</span>
            <Badge className={`${s.color} text-xs ml-auto shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mr-1.5 inline-block`} />
              {s.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Workflow Timeline — compact visual */}
        {nodes.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Workflow Progress — {wf?.name}</span>
              <span className="ml-auto text-xs text-slate-400">{done}/{total} steps</span>
            </div>
            {/* Step bubbles */}
            <div className="flex items-center gap-0 flex-wrap">
              {nodes.map((node, i) => {
                const isDone = completedSteps.includes(node.id);
                const isCurrent = node.id === project.current_step_id;
                const hist = (project.step_history || []).find(h => h.step_id === node.id);
                return (
                  <React.Fragment key={node.id}>
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      {/* Circle */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                        isDone    ? "bg-emerald-500 border-emerald-500" :
                        isCurrent ? "bg-blue-500 border-blue-500 ring-2 ring-blue-300 ring-offset-1" :
                                    "bg-white border-slate-300"
                      }`}>
                        {isDone    ? <CheckCircle2 className="w-4 h-4 text-white" /> :
                         isCurrent ? <Clock className="w-4 h-4 text-white animate-pulse" /> :
                         <span className="text-xs font-bold text-slate-400">{i + 1}</span>}
                      </div>
                      {/* Label */}
                      <span className={`text-[10px] font-medium text-center leading-tight max-w-[72px] ${
                        isDone ? "text-emerald-600" : isCurrent ? "text-blue-700" : "text-slate-400"
                      }`}>{node.label}</span>
                      {/* Completed date */}
                      {isDone && hist?.completed_at && (
                        <span className="text-[9px] text-emerald-500">{moment(hist.completed_at).format("D MMM")}</span>
                      )}
                      {isCurrent && (
                        <span className="text-[9px] text-blue-500 font-semibold">▶ Now</span>
                      )}
                    </div>
                    {i < nodes.length - 1 && (
                      <div className={`h-0.5 flex-1 min-w-[12px] max-w-[40px] mx-1 mb-6 rounded-full ${
                        isDone ? "bg-emerald-400" : "bg-slate-200"
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Info row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-0.5">Customer</p>
            <p className="font-medium text-slate-700">{project.customer_name || "—"}</p>
            {project.site_name && <p className="text-xs text-slate-500">{project.site_name}</p>}
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-0.5">Workflow</p>
            <p className="font-medium text-slate-700">{wf?.name || "—"}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-0.5">Progress</p>
            <p className="font-medium text-slate-700">{done}/{total} steps · {pct}%</p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {project.start_date || project.target_date ? (
          <div className="flex gap-4 text-xs text-slate-500">
            {project.start_date && <span>Start: <span className="font-medium text-slate-700">{moment(project.start_date).format("D MMM YYYY")}</span></span>}
            {project.target_date && <span>Target: <span className={`font-medium ${moment(project.target_date).isBefore(moment(), "day") && project.status !== "completed" ? "text-red-600" : "text-slate-700"}`}>{moment(project.target_date).format("D MMM YYYY")}</span></span>}
            {project.completed_date && <span>Completed: <span className="font-medium text-emerald-700">{moment(project.completed_date).format("D MMM YYYY")}</span></span>}
          </div>
        ) : null}

        {/* Steps + linked Work Orders — read only */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Workflow Steps & Work Orders</p>
            <span className="text-xs text-slate-400 ml-auto">อัปเดตสถานะผ่าน Work Orders</span>
          </div>
          <div className="space-y-2">
            {nodes.map((node, i) => {
              const isDone = completedSteps.includes(node.id);
              const isCurrent = node.id === project.current_step_id;
              const linkedWOs = workOrders.filter(w => w.project_step_id === node.id);
              const hist = (project.step_history || []).find(h => h.step_id === node.id);
              return (
                <div key={node.id} className={`rounded-xl border ${
                  isDone    ? "bg-emerald-50 border-emerald-200" :
                  isCurrent ? "bg-blue-50 border-blue-300" :
                              "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center gap-3 p-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isDone ? "bg-emerald-500" : isCurrent ? "bg-blue-500" : "bg-slate-200"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> :
                       isCurrent ? <Clock className="w-3.5 h-3.5 text-white" /> :
                       <span className="text-xs text-slate-500 font-bold">{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? "text-emerald-700 line-through" : isCurrent ? "text-blue-700" : "text-slate-600"}`}>
                        {node.label}
                      </p>
                      {isDone && hist && (
                        <p className="text-xs text-emerald-600">
                          Completed {moment(hist.completed_at).format("D MMM YYYY HH:mm")}
                          {hist.notes ? ` · ${hist.notes}` : ""}
                        </p>
                      )}
                      {isCurrent && <p className="text-xs text-blue-600 font-medium">▶ In Progress</p>}
                    </div>
                  </div>

                  {/* Linked Work Orders */}
                  {linkedWOs.length > 0 && (
                    <div className="mx-3 mb-3 space-y-1.5">
                      {linkedWOs.map(wo => (
                        <div key={wo.id} className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2.5">
                          <div className="text-xs text-slate-400 font-mono shrink-0">{wo.order_number}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{wo.title}</p>
                            {wo.assigned_technician_name && (
                              <p className="text-[10px] text-slate-400">👤 {wo.assigned_technician_name}</p>
                            )}
                          </div>
                          <Badge className={`text-[10px] shrink-0 ${WO_STATUS_COLOR[wo.status] || "bg-slate-100 text-slate-600"}`}>
                            {WO_STATUS_LABEL[wo.status] || wo.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {project.notes && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-slate-400 mb-1">Notes</p>
            <p className="text-sm text-slate-600">{project.notes}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function Projects() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list("-created_date", 200) });
  const { data: workflows = [] } = useQuery({ queryKey: ["workflows"], queryFn: () => base44.entities.Workflow.list("name", 100) });

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.customer_name?.toLowerCase().includes(search.toLowerCase()) || p.project_number?.includes(search);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const stats = useMemo(() => ({
    total: projects.length,
    in_progress: projects.filter(p => p.status === "in_progress").length,
    completed: projects.filter(p => p.status === "completed").length,
    overdue: projects.filter(p => p.target_date && p.status !== "completed" && moment(p.target_date).isBefore(moment(), "day")).length,
  }), [projects]);


  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Projects</h1>
          <p className="text-sm text-slate-500">Track end-to-end workflow execution per customer</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="text-xs text-blue-700">Projects ถูกสร้างอัตโนมัติจาก Work Orders — หน้านี้ใช้สำหรับ Tracking เท่านั้น</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Projects", value: stats.total, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
          { label: "In Progress", value: stats.in_progress, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
          { label: "Completed", value: stats.completed, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Overdue", value: stats.overdue, color: "text-red-600", bg: "bg-red-50 border-red-200" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search project, customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Project cards */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No projects found</p>
          <p className="text-xs mt-1 text-slate-300">Projects จะแสดงที่นี่เมื่อมีการสร้างจาก Work Orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} workflows={workflows} onSelect={setSelected} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <ProjectDetailModal
          project={selected} workflows={workflows}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}