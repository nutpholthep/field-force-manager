'use client';

import React, { useState, useMemo } from 'react';
import { entities } from '@/lib/entity-client';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  GripVertical,
  Calendar,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import moment, { type Moment } from 'moment';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DropResult,
} from '@hello-pangea/dnd';
import { toast } from 'sonner';
import type { TeamRole, Technician, WorkOrder } from '@ffm/shared';

function toMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function hasOverlap(existingJobs: WorkOrder[], newJob: WorkOrder): boolean {
  const newStart = toMinutes(newJob.scheduled_time);
  const newDur = (newJob.estimated_duration_hrs || 2) * 60;
  if (newStart === null) return false;
  for (const job of existingJobs) {
    const start = toMinutes(job.scheduled_time);
    if (start === null) continue;
    const dur = (job.estimated_duration_hrs || 2) * 60;
    if (newStart < start + dur && newStart + newDur > start) return true;
  }
  return false;
}

interface JobCardProps {
  wo: WorkOrder;
  prov: DraggableProvided;
  snap: DraggableStateSnapshot;
}

function JobCard({ wo, prov, snap }: JobCardProps) {
  return (
    <div
      ref={prov.innerRef}
      {...prov.draggableProps}
      className={`rounded px-1.5 py-1 text-[10px] leading-tight border select-none transition-shadow ${
        snap.isDragging ? 'shadow-lg ring-2 ring-blue-400 opacity-90 rotate-1 z-50' : ''
      } ${
        wo.priority === 'critical'
          ? 'bg-red-50 border-red-200 text-red-700'
          : wo.priority === 'high'
            ? 'bg-orange-50 border-orange-200 text-orange-700'
            : wo.priority === 'medium'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}
    >
      <div className="flex items-start gap-1">
        <div
          {...prov.dragHandleProps}
          className="mt-0.5 cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="w-2.5 h-2.5 opacity-40" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{wo.title}</p>
          <p className="text-[9px] opacity-60">
            {wo.scheduled_time ? `🕐 ${wo.scheduled_time}` : wo.service_type}
            {wo.estimated_duration_hrs ? ` · ${wo.estimated_duration_hrs}h` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

interface GroupedEntry {
  role: string;
  roleLabel: string;
  techs: Array<{ tech: Technician; dayJobs: Record<string, WorkOrder[]> }>;
}

interface WeekViewProps {
  groupedData: GroupedEntry[];
  days: Moment[];
  workOrders: WorkOrder[];
  technicians: Technician[];
  queryClient: QueryClient;
  isToday: (day: Moment) => boolean;
}

function WeekView({
  groupedData,
  days,
  workOrders,
  technicians,
  queryClient,
  isToday,
}: WeekViewProps) {
  const [collapsedRoles, setCollapsedRoles] = useState<Record<string, boolean>>({});

  const toggleRole = (role: string) =>
    setCollapsedRoles((prev) => ({ ...prev, [role]: !prev[role] }));

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    const [destTechId, destDate] = destination.droppableId.split('__');
    const [srcTechId] = source.droppableId.split('__');
    if (destTechId === srcTechId) return;
    const wo = workOrders.find((w) => w.id === draggableId);
    const destTech = technicians.find((t) => t.id === destTechId);
    if (!wo || !destTech) return;
    const destJobs = workOrders.filter(
      (w) =>
        w.assigned_technician_id === destTechId &&
        w.scheduled_date === destDate &&
        w.id !== wo.id,
    );
    if (hasOverlap(destJobs, wo)) {
      toast.error(
        `⚠️ Time conflict — ${destTech.full_name} มีงานทับซ้อนกันในเวลา ${
          wo.scheduled_time || 'นี้'
        } วันที่ ${destDate}`,
      );
      return;
    }
    await entities.WorkOrder.update(wo.id, {
      assigned_technician_id: destTechId,
      assigned_technician_name: destTech.full_name,
      scheduled_date: destDate,
    });
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    toast.success(`✅ ย้าย "${wo.title}" → ${destTech.full_name}`);
  };

  const roleColors: Record<string, string> = {
    supervisor: 'bg-purple-50 text-purple-700 border-purple-200',
    engineer: 'bg-blue-50 text-blue-700 border-blue-200',
    helper: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <Card className="overflow-hidden border-slate-200/80">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="text-left text-xs font-semibold text-slate-500 p-3 w-48 border-b border-r border-slate-200">
                  Technician
                </th>
                {days.map((day) => (
                  <th
                    key={day.format('YYYY-MM-DD')}
                    className={`text-center text-xs font-semibold p-3 border-b border-r border-slate-200 ${
                      isToday(day) ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
                    }`}
                  >
                    <div>{day.format('ddd')}</div>
                    <div
                      className={`text-lg font-bold ${
                        isToday(day) ? 'text-blue-600' : 'text-slate-700'
                      }`}
                    >
                      {day.format('D')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-12 text-sm">
                    ไม่พบช่างที่ตรงกับ Role ที่เลือก
                  </td>
                </tr>
              ) : (
                groupedData.map(({ role, roleLabel, techs }) => {
                  const isCollapsed = collapsedRoles[role];
                  const roleCls =
                    roleColors[role] || 'bg-slate-50 text-slate-600 border-slate-200';
                  return (
                    <React.Fragment key={role}>
                      <tr
                        className="cursor-pointer select-none bg-slate-50 hover:bg-slate-100 border-b border-slate-200"
                        onClick={() => toggleRole(role)}
                      >
                        <td className="px-3 py-2 border-r border-slate-200">
                          <div className="flex items-center gap-2">
                            {isCollapsed ? (
                              <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleCls}`}
                            >
                              {roleLabel}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {techs.length} คน
                            </span>
                          </div>
                        </td>
                        {days.map((day) => {
                          const dateStr = day.format('YYYY-MM-DD');
                          const total = techs.reduce(
                            (sum, { dayJobs }) => sum + (dayJobs[dateStr]?.length || 0),
                            0,
                          );
                          return (
                            <td
                              key={dateStr}
                              className={`border-r border-slate-200 text-center ${
                                isToday(day) ? 'bg-blue-50/30' : ''
                              }`}
                            >
                              {total > 0 ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-slate-700 text-[10px] font-bold">
                                  {total}
                                </span>
                              ) : (
                                <span className="text-slate-200 text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {!isCollapsed &&
                        techs.map(({ tech, dayJobs }) => (
                          <tr
                            key={tech.id}
                            className="border-b border-slate-100 hover:bg-slate-50/30"
                          >
                            <td className="p-2 pl-8 border-r border-slate-200">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-bold text-slate-600">
                                    {tech.full_name
                                      ?.split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-800 leading-tight">
                                    {tech.full_name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {tech.zone_name || 'No zone'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            {days.map((day) => {
                              const dateStr = day.format('YYYY-MM-DD');
                              const jobs = dayJobs[dateStr] || [];
                              return (
                                <td
                                  key={dateStr}
                                  className={`p-1 border-r border-slate-200 align-top ${
                                    isToday(day) ? 'bg-blue-50/30' : ''
                                  }`}
                                >
                                  <Droppable droppableId={`${tech.id}__${dateStr}`}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`space-y-1 min-h-[48px] rounded-md transition-colors p-0.5 ${
                                          snapshot.isDraggingOver
                                            ? 'bg-blue-100/60 ring-1 ring-blue-300'
                                            : ''
                                        }`}
                                      >
                                        {jobs.map((wo, index) => (
                                          <Draggable
                                            key={wo.id}
                                            draggableId={wo.id}
                                            index={index}
                                          >
                                            {(prov, snap) => (
                                              <JobCard wo={wo} prov={prov} snap={snap} />
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DragDropContext>
    </Card>
  );
}

interface MonthViewProps {
  monthStart: Moment;
  workOrders: WorkOrder[];
  filteredTechIds: string[];
  onWeekClick: (offset: number) => void;
}

function MonthView({ monthStart, workOrders, filteredTechIds, onWeekClick }: MonthViewProps) {
  const lastDay = monthStart.clone().endOf('month');
  const weeks: Moment[] = [];
  let cur = monthStart.clone().startOf('month').startOf('isoWeek');
  while (cur.isSameOrBefore(lastDay, 'day')) {
    weeks.push(cur.clone());
    cur.add(1, 'week');
  }
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="overflow-hidden border-slate-200/80">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="text-xs font-semibold text-slate-500 p-3 border-b border-r border-slate-200 w-16 text-center">
                Week
              </th>
              {daysOfWeek.map((d) => (
                <th
                  key={d}
                  className="text-center text-xs font-semibold text-slate-500 p-3 border-b border-r border-slate-200"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((weekStart) => {
              const days = Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, 'days'));
              const weekOffset = weekStart.diff(moment().startOf('isoWeek'), 'weeks');
              return (
                <tr
                  key={weekStart.format('YYYY-MM-DD')}
                  className="border-b border-slate-100"
                >
                  <td className="border-r border-slate-200 text-center p-2">
                    <button
                      onClick={() => onWeekClick(weekOffset)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      W{weekStart.isoWeek()}
                    </button>
                  </td>
                  {days.map((day) => {
                    const dateStr = day.format('YYYY-MM-DD');
                    const inMonth = day.isSame(monthStart, 'month');
                    const isToday = day.isSame(moment(), 'day');
                    const count = workOrders.filter((wo) => {
                      const techMatch =
                        filteredTechIds.length === 0 ||
                        filteredTechIds.includes(wo.assigned_technician_id || '');
                      return wo.scheduled_date === dateStr && techMatch;
                    }).length;
                    return (
                      <td
                        key={dateStr}
                        className={`border-r border-slate-200 p-2 text-center h-16 align-middle ${
                          !inMonth ? 'bg-slate-50/60 opacity-40' : ''
                        } ${isToday ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-xs font-medium ${
                              isToday ? 'text-blue-700' : 'text-slate-500'
                            }`}
                          >
                            {day.format('D')}
                          </span>
                          {count > 0 ? (
                            <button
                              onClick={() => onWeekClick(weekOffset)}
                              className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm flex items-center justify-center"
                              title={`${count} งาน — คลิกเพื่อดูสัปดาห์นี้`}
                            >
                              {count}
                            </button>
                          ) : (
                            <span className="w-8 h-8 flex items-center justify-center text-slate-200 text-xs">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: workOrders = [], isLoading: woLoading } = useQuery<WorkOrder[]>({
    queryKey: ['workOrders'],
    queryFn: () => entities.WorkOrder.list('-scheduled_date', 500),
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ['technicians'],
    queryFn: () => entities.Technician.list('-created_date', 200),
  });

  const { data: teamRoles = [] } = useQuery<TeamRole[]>({
    queryKey: ['teamRoles'],
    queryFn: () => entities.TeamRole.list(),
  });

  const activeTechs = useMemo(
    () => technicians.filter((t) => t.status === 'active'),
    [technicians],
  );

  const availableRoles = useMemo(() => {
    const roleCodes = [
      ...new Set(activeTechs.map((t) => t.team_role).filter(Boolean) as string[]),
    ];
    return roleCodes.map((code) => {
      const master = teamRoles.find((r) => r.code === code);
      return { code, label: master?.name || code };
    });
  }, [activeTechs, teamRoles]);

  const toggleRole = (code: string) => {
    setSelectedRoles((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code],
    );
  };

  const filteredTechs = useMemo(
    () =>
      selectedRoles.length === 0
        ? activeTechs
        : activeTechs.filter((t) => selectedRoles.includes(t.team_role || '')),
    [activeTechs, selectedRoles],
  );

  const weekStart = moment().startOf('isoWeek').add(weekOffset, 'weeks');
  const days = Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, 'days'));
  const monthStart = moment().startOf('month').add(monthOffset, 'months');

  const groupedData: GroupedEntry[] = useMemo(() => {
    const roleMap: Record<string, Technician[]> = {};
    filteredTechs.forEach((tech) => {
      const role = tech.team_role || 'other';
      if (!roleMap[role]) roleMap[role] = [];
      roleMap[role].push(tech);
    });
    return Object.entries(roleMap).map(([role, techs]) => {
      const master = teamRoles.find((r) => r.code === role);
      return {
        role,
        roleLabel: master?.name || role,
        techs: techs.map((tech) => {
          const techJobs = workOrders.filter((wo) => wo.assigned_technician_id === tech.id);
          const dayJobs: Record<string, WorkOrder[]> = {};
          days.forEach((day) => {
            const dateStr = day.format('YYYY-MM-DD');
            dayJobs[dateStr] = techJobs.filter((wo) => wo.scheduled_date === dateStr);
          });
          return { tech, dayJobs };
        }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTechs, workOrders, weekOffset, teamRoles]);

  const filteredTechIds = useMemo(() => filteredTechs.map((t) => t.id), [filteredTechs]);

  const isToday = (day: Moment) => day.isSame(moment(), 'day');

  const handleWeekClick = (offset: number) => {
    setWeekOffset(offset);
    setViewMode('week');
  };

  if (woLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (viewMode === 'week') setWeekOffset((w) => w - 1);
              else setMonthOffset((m) => m - 1);
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (viewMode === 'week') setWeekOffset((w) => w + 1);
              else setMonthOffset((m) => m + 1);
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setWeekOffset(0);
              setMonthOffset(0);
            }}
          >
            <CalendarDays className="w-4 h-4 mr-1" /> Today
          </Button>
          <span className="text-sm font-semibold text-slate-700 ml-1">
            {viewMode === 'week'
              ? `${weekStart.format('MMM D')} — ${weekStart
                  .clone()
                  .add(6, 'days')
                  .format('MMM D, YYYY')}`
              : monthStart.format('MMMM YYYY')}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            className="h-7 px-3 text-xs"
            onClick={() => setViewMode('week')}
          >
            <CalendarDays className="w-3.5 h-3.5 mr-1" /> Week
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            className="h-7 px-3 text-xs"
            onClick={() => setViewMode('month')}
          >
            <Calendar className="w-3.5 h-3.5 mr-1" /> Month
          </Button>
        </div>
      </div>

      {availableRoles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 shrink-0">Role:</span>
          <button
            onClick={() => setSelectedRoles([])}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              selectedRoles.length === 0
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            ทั้งหมด
          </button>
          {availableRoles.map(({ code, label }) => {
            const isSelected = selectedRoles.includes(code);
            const count = activeTechs.filter((t) => t.team_role === code).length;
            return (
              <button
                key={code}
                onClick={() => toggleRole(code)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {label}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20' : 'bg-slate-100'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {viewMode === 'week' ? (
        <>
          <p className="text-xs text-slate-400 italic">
            ลาก job card เพื่อย้ายช่าง · คลิก Role header เพื่อ collapse
          </p>
          <WeekView
            groupedData={groupedData}
            days={days}
            workOrders={workOrders}
            technicians={technicians}
            queryClient={queryClient}
            isToday={isToday}
          />
        </>
      ) : (
        <>
          <p className="text-xs text-slate-400 italic">
            คลิกตัวเลขในช่องเพื่อดูรายละเอียดในมุมมองสัปดาห์
          </p>
          <MonthView
            monthStart={monthStart}
            workOrders={workOrders}
            filteredTechIds={filteredTechIds}
            onWeekClick={handleWeekClick}
          />
        </>
      )}
    </div>
  );
}
