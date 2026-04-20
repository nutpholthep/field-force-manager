import type { Prisma, PrismaClient } from '@prisma/client';
import {
  ActiveStatus,
  CustomerType,
  DurationUnit,
  NotificationType,
  ProjectStatus,
  SiteType,
  SlaRisk,
  StuckReasonCategory,
  TechnicianAvailability,
  TechnicianStatus,
  WorkOrderPriority,
  WorkOrderServiceType,
  WorkOrderStatus,
} from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const WORK_ORDER_SERVICE_ALIASES: Record<string, WorkOrderServiceType> = {
  repair_equip: 'repair',
  test: 'maintenance',
  pm: 'maintenance',
  pm_solar: 'maintenance',
};

function trimCell(s: string | undefined): string {
  return (s ?? '').trim();
}

function parseBool(s: string | undefined, defaultVal = false): boolean {
  const v = trimCell(s).toLowerCase();
  if (!v) return defaultVal;
  return v === 'true' || v === '1' || v === 'yes';
}

function parseNum(s: string | undefined): number | undefined {
  const v = trimCell(s);
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseIntSafe(s: string | undefined, d = 0): number {
  const n = parseNum(s);
  return n !== undefined ? Math.trunc(n) : d;
}

function parseDate(s: string | undefined): Date | undefined {
  const v = trimCell(s);
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseJson<T>(s: string | undefined, fallback: T): T {
  const v = trimCell(s);
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function parseStringArray(s: string | undefined): string[] {
  const arr = parseJson<unknown>(s, []);
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
}

function optFk(s: string | undefined): string | undefined {
  const v = trimCell(s);
  return v || undefined;
}

function readCsvRows(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  }) as Record<string, string>[];
}

function isEnumMember<T extends string>(allowed: readonly T[], v: string | undefined, fallback: T): T {
  const k = trimCell(v).toLowerCase() as T;
  return (allowed as readonly string[]).includes(k) ? (k as T) : fallback;
}

function mapWorkOrderServiceType(raw: string | undefined): WorkOrderServiceType {
  const k = trimCell(raw).toLowerCase();
  if (WORK_ORDER_SERVICE_ALIASES[k]) return WORK_ORDER_SERVICE_ALIASES[k];
  const allowed: WorkOrderServiceType[] = [
    'installation',
    'maintenance',
    'repair',
    'inspection',
    'emergency',
    'upgrade',
    'removal',
  ];
  return isEnumMember(allowed, k, 'maintenance');
}

function mapWorkOrderStatus(raw: string | undefined): WorkOrderStatus {
  const k = trimCell(raw).toLowerCase();
  const allowed: WorkOrderStatus[] = [
    'created',
    'assigned',
    'accepted',
    'traveling',
    'on_site',
    'working',
    'stuck',
    'completed',
    'cancelled',
  ];
  return isEnumMember(allowed, k, 'created');
}

function mapProjectStatus(raw: string | undefined): ProjectStatus {
  const allowed: ProjectStatus[] = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'planning');
}

function mapSiteType(raw: string | undefined): SiteType {
  const allowed: SiteType[] = [
    'office',
    'warehouse',
    'factory',
    'retail',
    'residential',
    'data_center',
    'outdoor',
  ];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'office');
}

function mapCustomerType(raw: string | undefined): CustomerType {
  const allowed: CustomerType[] = ['residential', 'commercial', 'industrial', 'government'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'commercial');
}

function mapTechnicianStatus(raw: string | undefined): TechnicianStatus {
  const allowed: TechnicianStatus[] = ['active', 'inactive', 'on_leave', 'suspended'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'active');
}

function mapTechnicianAvailability(raw: string | undefined): TechnicianAvailability {
  const allowed: TechnicianAvailability[] = ['available', 'busy', 'offline', 'break'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'available');
}

function mapSlaRisk(raw: string | undefined): SlaRisk {
  const allowed: SlaRisk[] = ['low', 'medium', 'high'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'low');
}

function mapActiveStatus(raw: string | undefined): ActiveStatus {
  const allowed: ActiveStatus[] = ['active', 'inactive'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'active');
}

function mapDurationUnit(raw: string | undefined): DurationUnit {
  const allowed: DurationUnit[] = ['minutes', 'hours', 'days'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'hours');
}

function mapStuckCategory(raw: string | undefined): StuckReasonCategory {
  const allowed: StuckReasonCategory[] = ['parts', 'access', 'technical', 'customer', 'weather', 'other'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'other');
}

function mapMaterialItemType(raw: string | undefined): 'item' | 'service' {
  const k = trimCell(raw).toLowerCase();
  return k === 'service' ? 'service' : 'item';
}

function mapNotificationType(raw: string | undefined): NotificationType {
  const allowed: NotificationType[] = ['info', 'warning', 'error', 'success'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'info');
}

function mapWorkOrderPriority(raw: string | undefined): WorkOrderPriority {
  const allowed: WorkOrderPriority[] = ['critical', 'high', 'medium', 'low'];
  return isEnumMember(allowed, trimCell(raw).toLowerCase(), 'medium');
}

export function resolveDefaultCsvDir(): string {
  return path.resolve(__dirname, '..', '..', '..', '..', 'database');
}

export function csvDatasetExists(dir: string): boolean {
  const marker = path.join(dir, 'Customer_export.csv');
  return fs.existsSync(marker);
}

export async function seedFromCsvDir(prisma: PrismaClient, dir: string): Promise<void> {
  if (!csvDatasetExists(dir)) {
    // eslint-disable-next-line no-console
    console.log(`[seed] No CSV dataset at ${dir} (missing Customer_export.csv); skipping CSV import.`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] Importing CSV dataset from ${dir}`);

  const aiPath = path.join(dir, 'AIAgent_export.csv');
  if (fs.existsSync(aiPath)) {
    for (const row of readCsvRows(aiPath)) {
      const assignedZoneIds = parseStringArray(row.assigned_zone_ids);
      const assignedZoneNames = parseStringArray(row.assigned_zone_names);
      const dataSkills = parseStringArray(row.data_skills);
      const cfg: Prisma.JsonObject = {
        llm_provider: trimCell(row.llm_provider) || undefined,
        llm_api_url: trimCell(row.llm_api_url) || undefined,
        last_run_at: trimCell(row.last_run_at) || undefined,
        last_run_summary: trimCell(row.last_run_summary) || undefined,
        check_interval_minutes: parseIntSafe(row.check_interval_minutes, 30),
        sla_warning_hours: parseIntSafe(row.sla_warning_hours, 2),
        data_skills: dataSkills,
        can_send_email: parseBool(row.can_send_email),
      };
      const modelParts = [trimCell(row.llm_provider), trimCell(row.llm_model)].filter(Boolean);
      await prisma.aIAgent.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'AI Agent',
          description: trimCell(row.description) || undefined,
          model: modelParts.length ? modelParts.join('/') : trimCell(row.llm_model) || undefined,
          llm_provider: trimCell(row.llm_provider) || undefined,
          llm_model: trimCell(row.llm_model) || undefined,
          llm_api_url: trimCell(row.llm_api_url) || undefined,
          llm_api_key: trimCell(row.llm_api_key) || undefined,
          notification_email: trimCell(row.notification_email) || undefined,
          sla_warning_hours: parseNum(row.sla_warning_hours),
          check_interval_minutes: parseNum(row.check_interval_minutes),
          data_skills: dataSkills,
          can_send_email: parseBool(row.can_send_email, false),
          last_run_at: parseDate(row.last_run_at),
          last_run_summary: trimCell(row.last_run_summary) || undefined,
          system_prompt: trimCell(row.system_prompt) || undefined,
          config: cfg,
          assigned_zone_ids: assignedZoneIds,
          assigned_zone_names: assignedZoneNames,
          is_active: parseBool(row.is_active, true),
        },
        update: {
          name: trimCell(row.name) || 'AI Agent',
          description: trimCell(row.description) || undefined,
          model: modelParts.length ? modelParts.join('/') : trimCell(row.llm_model) || undefined,
          llm_provider: trimCell(row.llm_provider) || undefined,
          llm_model: trimCell(row.llm_model) || undefined,
          llm_api_url: trimCell(row.llm_api_url) || undefined,
          llm_api_key: trimCell(row.llm_api_key) || undefined,
          notification_email: trimCell(row.notification_email) || undefined,
          sla_warning_hours: parseNum(row.sla_warning_hours),
          check_interval_minutes: parseNum(row.check_interval_minutes),
          data_skills: dataSkills,
          can_send_email: parseBool(row.can_send_email, false),
          last_run_at: parseDate(row.last_run_at),
          last_run_summary: trimCell(row.last_run_summary) || undefined,
          system_prompt: trimCell(row.system_prompt) || undefined,
          config: cfg,
          assigned_zone_ids: assignedZoneIds,
          assigned_zone_names: assignedZoneNames,
          is_active: parseBool(row.is_active, true),
        },
      });
    }
  }

  const zonePath = path.join(dir, 'Zone_export.csv');
  const zoneNameToId = new Map<string, string>();
  if (fs.existsSync(zonePath)) {
    for (const row of readCsvRows(zonePath)) {
      let agentName: string | undefined;
      const aid = optFk(row.agent_id);
      if (aid) {
        const ag = await prisma.aIAgent.findUnique({ where: { id: aid }, select: { name: true } });
        agentName = ag?.name;
      }
      const polygon = parseJson(row.polygon, []);
      const provinces = parseJson(row.provinces, []);
      await prisma.zone.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'Zone',
          code: trimCell(row.code) || undefined,
          description: trimCell(row.description) || undefined,
          color: trimCell(row.color) || '#3b82f6',
          polygon,
          provinces,
          technician_count: parseIntSafe(row.technician_count, 0),
          avg_daily_jobs: parseNum(row.avg_daily_jobs),
          center_latitude: parseNum(row.center_latitude),
          center_longitude: parseNum(row.center_longitude),
          agent_id: aid,
          agent_name: agentName,
          is_active: !trimCell(row.status) || trimCell(row.status).toLowerCase() !== 'inactive',
        },
        update: {
          name: trimCell(row.name) || 'Zone',
          code: trimCell(row.code) || undefined,
          description: trimCell(row.description) || undefined,
          color: trimCell(row.color) || '#3b82f6',
          polygon,
          provinces,
          technician_count: parseIntSafe(row.technician_count, 0),
          avg_daily_jobs: parseNum(row.avg_daily_jobs),
          center_latitude: parseNum(row.center_latitude),
          center_longitude: parseNum(row.center_longitude),
          agent_id: aid,
          agent_name: agentName,
          is_active: !trimCell(row.status) || trimCell(row.status).toLowerCase() !== 'inactive',
        },
      });
      zoneNameToId.set(trimCell(row.name), row.id);
      if (trimCell(row.code)) zoneNameToId.set(trimCell(row.code), row.id);
    }
  }

  const teamRolePath = path.join(dir, 'TeamRole_export.csv');
  if (fs.existsSync(teamRolePath)) {
    for (const row of readCsvRows(teamRolePath)) {
      await prisma.teamRole.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'Role',
          code: trimCell(row.code),
          color: trimCell(row.color) || undefined,
          description: trimCell(row.description) || undefined,
          is_active: parseBool(row.is_active, true),
        },
        update: {
          name: trimCell(row.name) || 'Role',
          code: trimCell(row.code),
          color: trimCell(row.color) || undefined,
          description: trimCell(row.description) || undefined,
          is_active: parseBool(row.is_active, true),
        },
      });
    }
  }

  const teamPath = path.join(dir, 'Team_export.csv');
  const teamNameToId = new Map<string, string>();
  if (fs.existsSync(teamPath)) {
    for (const row of readCsvRows(teamPath)) {
      let zoneId = optFk(row.zone_id);
      if (!zoneId && trimCell(row.zone_name)) {
        zoneId = zoneNameToId.get(trimCell(row.zone_name));
      }
      await prisma.team.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'Team',
          code: trimCell(row.code) || undefined,
          description: trimCell(row.description) || undefined,
          zone_id: zoneId,
          zone_name: trimCell(row.zone_name) || undefined,
          is_active: parseBool(row.is_active, true),
        },
        update: {
          name: trimCell(row.name) || 'Team',
          code: trimCell(row.code) || undefined,
          description: trimCell(row.description) || undefined,
          zone_id: zoneId,
          zone_name: trimCell(row.zone_name) || undefined,
          is_active: parseBool(row.is_active, true),
        },
      });
      teamNameToId.set(trimCell(row.name), row.id);
    }
  }

  const customerPath = path.join(dir, 'Customer_export.csv');
  if (fs.existsSync(customerPath)) {
    for (const row of readCsvRows(customerPath)) {
      await prisma.customer.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'Customer',
          contact_person: trimCell(row.contact_person) || undefined,
          email: trimCell(row.email) || undefined,
          phone: trimCell(row.phone) || undefined,
          address: trimCell(row.address) || undefined,
          notes: trimCell(row.notes) || undefined,
          total_work_orders: parseIntSafe(row.total_work_orders, 0),
          latitude: parseNum(row.latitude),
          longitude: parseNum(row.longitude),
          type: mapCustomerType(row.type),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          name: trimCell(row.name) || 'Customer',
          contact_person: trimCell(row.contact_person) || undefined,
          email: trimCell(row.email) || undefined,
          phone: trimCell(row.phone) || undefined,
          address: trimCell(row.address) || undefined,
          notes: trimCell(row.notes) || undefined,
          total_work_orders: parseIntSafe(row.total_work_orders, 0),
          latitude: parseNum(row.latitude),
          longitude: parseNum(row.longitude),
          type: mapCustomerType(row.type),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const sitePath = path.join(dir, 'Site_export.csv');
  if (fs.existsSync(sitePath)) {
    for (const row of readCsvRows(sitePath)) {
      let zoneId = optFk(row.zone_id);
      if (!zoneId && trimCell(row.zone_name)) {
        zoneId = zoneNameToId.get(trimCell(row.zone_name));
      }
      const equipment = parseStringArray(row.equipment);
      await prisma.site.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'Site',
          customer_id: optFk(row.customer_id),
          customer_name: trimCell(row.customer_name) || undefined,
          address: trimCell(row.address) || undefined,
          zone_id: zoneId,
          zone_name: trimCell(row.zone_name) || undefined,
          site_type: mapSiteType(row.site_type),
          equipment,
          access_instructions: trimCell(row.access_instructions) || undefined,
          status: mapActiveStatus(row.status),
          latitude: parseNum(row.latitude),
          longitude: parseNum(row.longitude),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          name: trimCell(row.name) || 'Site',
          customer_id: optFk(row.customer_id),
          customer_name: trimCell(row.customer_name) || undefined,
          address: trimCell(row.address) || undefined,
          zone_id: zoneId,
          zone_name: trimCell(row.zone_name) || undefined,
          site_type: mapSiteType(row.site_type),
          equipment,
          access_instructions: trimCell(row.access_instructions) || undefined,
          status: mapActiveStatus(row.status),
          latitude: parseNum(row.latitude),
          longitude: parseNum(row.longitude),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const skillPath = path.join(dir, 'Skill_export.csv');
  if (fs.existsSync(skillPath)) {
    for (const row of readCsvRows(skillPath)) {
      await prisma.skill.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'Skill',
          category: trimCell(row.category) || undefined,
          description: trimCell(row.description) || undefined,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          name: trimCell(row.name) || 'Skill',
          category: trimCell(row.category) || undefined,
          description: trimCell(row.description) || undefined,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const prioPath = path.join(dir, 'PriorityMaster_export.csv');
  if (fs.existsSync(prioPath)) {
    for (const row of readCsvRows(prioPath)) {
      await prisma.priorityMaster.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || trimCell(row.code) || 'Priority',
          code: trimCell(row.code) || undefined,
          color: trimCell(row.color) || '#3b82f6',
          duration_value: parseIntSafe(row.duration_value, 4),
          duration_unit: mapDurationUnit(row.duration_unit),
          description: trimCell(row.description) || undefined,
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          name: trimCell(row.name) || trimCell(row.code) || 'Priority',
          code: trimCell(row.code) || undefined,
          color: trimCell(row.color) || '#3b82f6',
          duration_value: parseIntSafe(row.duration_value, 4),
          duration_unit: mapDurationUnit(row.duration_unit),
          description: trimCell(row.description) || undefined,
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const stuckPath = path.join(dir, 'StuckReason_export.csv');
  if (fs.existsSync(stuckPath)) {
    for (const row of readCsvRows(stuckPath)) {
      await prisma.stuckReason.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'Stuck reason',
          code: trimCell(row.code),
          category: mapStuckCategory(row.category),
          description: trimCell(row.description) || undefined,
          color: trimCell(row.color) || '#f59e0b',
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          name: trimCell(row.name) || 'Stuck reason',
          code: trimCell(row.code),
          category: mapStuckCategory(row.category),
          description: trimCell(row.description) || undefined,
          color: trimCell(row.color) || '#f59e0b',
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const matCatPath = path.join(dir, 'MaterialCategory_export.csv');
  if (fs.existsSync(matCatPath)) {
    for (const row of readCsvRows(matCatPath)) {
      await prisma.materialCategory.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'Category',
          code: trimCell(row.code),
          description: trimCell(row.description) || undefined,
          color: trimCell(row.color) || '#3b82f6',
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          name: trimCell(row.name) || 'Category',
          code: trimCell(row.code),
          description: trimCell(row.description) || undefined,
          color: trimCell(row.color) || '#3b82f6',
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const matPath = path.join(dir, 'Material_export.csv');
  if (fs.existsSync(matPath)) {
    for (const row of readCsvRows(matPath)) {
      const keywords = parseStringArray(row.keywords);
      await prisma.material.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          item_number: trimCell(row.item_number),
          item_name: trimCell(row.item_name) || trimCell(row.item_number),
          description: trimCell(row.description) || undefined,
          category_id: optFk(row.category_id),
          category_name: trimCell(row.category_name) || undefined,
          item_group: trimCell(row.item_group) || undefined,
          item_type: mapMaterialItemType(row.item_type),
          unit: trimCell(row.unit) || undefined,
          warehouse: trimCell(row.warehouse) || undefined,
          stock_qty: parseNum(row.stock_qty) ?? 0,
          min_stock_qty: parseNum(row.min_stock_qty) ?? 0,
          cost_price: parseNum(row.cost_price),
          keywords,
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          item_number: trimCell(row.item_number),
          item_name: trimCell(row.item_name) || trimCell(row.item_number),
          description: trimCell(row.description) || undefined,
          category_id: optFk(row.category_id),
          category_name: trimCell(row.category_name) || undefined,
          item_group: trimCell(row.item_group) || undefined,
          item_type: mapMaterialItemType(row.item_type),
          unit: trimCell(row.unit) || undefined,
          warehouse: trimCell(row.warehouse) || undefined,
          stock_qty: parseNum(row.stock_qty) ?? 0,
          min_stock_qty: parseNum(row.min_stock_qty) ?? 0,
          cost_price: parseNum(row.cost_price),
          keywords,
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const svcPath = path.join(dir, 'ServiceType_export.csv');
  if (fs.existsSync(svcPath)) {
    for (const row of readCsvRows(svcPath)) {
      const causes = parseJson(row.causes, []);
      const steps = parseJson(row.steps, []);
      const allowedPriorityIds = parseStringArray(row.allowed_priority_ids);
      const requiredSkillIds = parseStringArray(row.required_skill_ids);
      await prisma.serviceType.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || trimCell(row.code) || 'Service',
          code: trimCell(row.code) || undefined,
          description: trimCell(row.description) || undefined,
          required_skill_ids: requiredSkillIds,
          allowed_priority_ids: allowedPriorityIds,
          default_priority_id: optFk(row.default_priority_id) || undefined,
          default_priority: trimCell(row.default_priority) || undefined,
          default_duration_hrs: parseNum(row.default_duration_hrs) ?? 2,
          steps,
          causes,
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          name: trimCell(row.name) || trimCell(row.code) || 'Service',
          code: trimCell(row.code) || undefined,
          description: trimCell(row.description) || undefined,
          required_skill_ids: requiredSkillIds,
          allowed_priority_ids: allowedPriorityIds,
          default_priority_id: optFk(row.default_priority_id) || undefined,
          default_priority: trimCell(row.default_priority) || undefined,
          default_duration_hrs: parseNum(row.default_duration_hrs) ?? 2,
          steps,
          causes,
          is_active: parseBool(row.is_active, true),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const wfPath = path.join(dir, 'Workflow_export.csv');
  if (fs.existsSync(wfPath)) {
    for (const row of readCsvRows(wfPath)) {
      const nodes = parseJson(row.nodes, []);
      const edges = parseJson(row.edges, []);
      await prisma.workflow.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: trimCell(row.name) || 'Workflow',
          description: trimCell(row.description) || undefined,
          nodes,
          edges,
          version: trimCell(row.version) || undefined,
          is_active: trimCell(row.status).toLowerCase() !== 'archived',
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          name: trimCell(row.name) || 'Workflow',
          description: trimCell(row.description) || undefined,
          nodes,
          edges,
          version: trimCell(row.version) || undefined,
          is_active: trimCell(row.status).toLowerCase() !== 'archived',
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const techPath = path.join(dir, 'Technician_export.csv');
  if (fs.existsSync(techPath)) {
    for (const row of readCsvRows(techPath)) {
      let zoneId = optFk(row.zone_id);
      if (!zoneId && trimCell(row.zone_name)) {
        zoneId = zoneNameToId.get(trimCell(row.zone_name));
      }
      let teamId = optFk(row.team_id);
      if (!teamId && trimCell(row.team_name)) {
        teamId = teamNameToId.get(trimCell(row.team_name));
      }
      const skills = parseStringArray(row.skills);
      const certifications = parseStringArray(row.certifications);
      await prisma.technician.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          technician_code: trimCell(row.technician_code),
          full_name: trimCell(row.full_name) || trimCell(row.technician_code),
          email: trimCell(row.email) || undefined,
          phone: trimCell(row.phone) || undefined,
          photo_url: trimCell(row.photo_url) || undefined,
          linked_user_id: optFk(row.linked_user_id),
          linked_user_email: trimCell(row.linked_user_email) || undefined,
          status: mapTechnicianStatus(row.status),
          team_role: trimCell(row.team_role) || undefined,
          team_role_name: trimCell(row.team_role_name) || undefined,
          team_id: teamId,
          team_name: trimCell(row.team_name) || undefined,
          home_latitude: parseNum(row.home_latitude),
          home_longitude: parseNum(row.home_longitude),
          current_latitude: parseNum(row.current_latitude),
          current_longitude: parseNum(row.current_longitude),
          zone_id: zoneId,
          zone_name: trimCell(row.zone_name) || undefined,
          skills,
          certifications,
          max_daily_jobs: parseIntSafe(row.max_daily_jobs, 6),
          current_daily_jobs: parseIntSafe(row.current_daily_jobs, 0),
          avg_completion_time_hrs: parseNum(row.avg_completion_time_hrs),
          sla_compliance_rate: parseNum(row.sla_compliance_rate),
          customer_rating: parseNum(row.customer_rating),
          jobs_completed_total: parseIntSafe(row.jobs_completed_total, 0),
          performance_score: parseNum(row.performance_score),
          availability: mapTechnicianAvailability(row.availability),
          working_hours_start: trimCell(row.working_hours_start) || '08:00',
          working_hours_end: trimCell(row.working_hours_end) || '17:00',
          hourly_rate: parseNum(row.hourly_rate),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          technician_code: trimCell(row.technician_code),
          full_name: trimCell(row.full_name) || trimCell(row.technician_code),
          email: trimCell(row.email) || undefined,
          phone: trimCell(row.phone) || undefined,
          photo_url: trimCell(row.photo_url) || undefined,
          linked_user_id: optFk(row.linked_user_id),
          linked_user_email: trimCell(row.linked_user_email) || undefined,
          status: mapTechnicianStatus(row.status),
          team_role: trimCell(row.team_role) || undefined,
          team_role_name: trimCell(row.team_role_name) || undefined,
          team_id: teamId,
          team_name: trimCell(row.team_name) || undefined,
          home_latitude: parseNum(row.home_latitude),
          home_longitude: parseNum(row.home_longitude),
          current_latitude: parseNum(row.current_latitude),
          current_longitude: parseNum(row.current_longitude),
          zone_id: zoneId,
          zone_name: trimCell(row.zone_name) || undefined,
          skills,
          certifications,
          max_daily_jobs: parseIntSafe(row.max_daily_jobs, 6),
          current_daily_jobs: parseIntSafe(row.current_daily_jobs, 0),
          avg_completion_time_hrs: parseNum(row.avg_completion_time_hrs),
          sla_compliance_rate: parseNum(row.sla_compliance_rate),
          customer_rating: parseNum(row.customer_rating),
          jobs_completed_total: parseIntSafe(row.jobs_completed_total, 0),
          performance_score: parseNum(row.performance_score),
          availability: mapTechnicianAvailability(row.availability),
          working_hours_start: trimCell(row.working_hours_start) || '08:00',
          working_hours_end: trimCell(row.working_hours_end) || '17:00',
          hourly_rate: parseNum(row.hourly_rate),
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const projPath = path.join(dir, 'Project_export.csv');
  if (fs.existsSync(projPath)) {
    for (const row of readCsvRows(projPath)) {
      const completedSteps = parseStringArray(row.completed_steps);
      const stepHistory = parseJson(row.step_history, []);
      const tags = parseStringArray(row.tags);
      await prisma.project.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          project_number: trimCell(row.project_number) || undefined,
          name: trimCell(row.name) || 'Project',
          description: trimCell(row.description) || undefined,
          customer_id: optFk(row.customer_id),
          customer_name: trimCell(row.customer_name) || undefined,
          site_id: optFk(row.site_id),
          site_name: trimCell(row.site_name) || undefined,
          workflow_id: trimCell(row.workflow_id),
          workflow_name: trimCell(row.workflow_name) || undefined,
          current_step_id: trimCell(row.current_step_id) || undefined,
          current_step_name: trimCell(row.current_step_name) || undefined,
          status: mapProjectStatus(row.status),
          priority: mapWorkOrderPriority(row.priority),
          assigned_technician_id: optFk(row.assigned_technician_id),
          assigned_technician_name: trimCell(row.assigned_technician_name) || undefined,
          start_date: parseDate(row.start_date),
          target_date: parseDate(row.target_date),
          completed_date: parseDate(row.completed_date),
          completed_steps: completedSteps,
          step_history: stepHistory,
          notes: trimCell(row.notes) || undefined,
          tags,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          project_number: trimCell(row.project_number) || undefined,
          name: trimCell(row.name) || 'Project',
          description: trimCell(row.description) || undefined,
          customer_id: optFk(row.customer_id),
          customer_name: trimCell(row.customer_name) || undefined,
          site_id: optFk(row.site_id),
          site_name: trimCell(row.site_name) || undefined,
          workflow_id: trimCell(row.workflow_id),
          workflow_name: trimCell(row.workflow_name) || undefined,
          current_step_id: trimCell(row.current_step_id) || undefined,
          current_step_name: trimCell(row.current_step_name) || undefined,
          status: mapProjectStatus(row.status),
          priority: mapWorkOrderPriority(row.priority),
          assigned_technician_id: optFk(row.assigned_technician_id),
          assigned_technician_name: trimCell(row.assigned_technician_name) || undefined,
          start_date: parseDate(row.start_date),
          target_date: parseDate(row.target_date),
          completed_date: parseDate(row.completed_date),
          completed_steps: completedSteps,
          step_history: stepHistory,
          notes: trimCell(row.notes) || undefined,
          tags,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const woPath = path.join(dir, 'WorkOrder_export.csv');
  if (fs.existsSync(woPath)) {
    for (const row of readCsvRows(woPath)) {
      const requiredSkills = parseStringArray(row.required_skills);
      const attachments = parseStringArray(row.attachments);
      const scheduledDate = parseDate(row.scheduled_date);
      await prisma.workOrder.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          order_number: trimCell(row.order_number),
          title: trimCell(row.title) || trimCell(row.order_number),
          description: trimCell(row.description) || undefined,
          status: mapWorkOrderStatus(row.status),
          stuck_reason_id: optFk(row.stuck_reason_id),
          stuck_reason_name: trimCell(row.stuck_reason_name) || undefined,
          stuck_note: trimCell(row.stuck_note) || undefined,
          priority: mapWorkOrderPriority(row.priority),
          service_type: mapWorkOrderServiceType(row.service_type),
          required_skills: requiredSkills,
          customer_name: trimCell(row.customer_name) || undefined,
          customer_id: optFk(row.customer_id),
          site_name: trimCell(row.site_name) || undefined,
          site_id: optFk(row.site_id),
          site_latitude: parseNum(row.site_latitude),
          site_longitude: parseNum(row.site_longitude),
          zone_name: trimCell(row.zone_name) || undefined,
          assigned_technician_id: optFk(row.assigned_technician_id),
          assigned_technician_name: trimCell(row.assigned_technician_name) || undefined,
          sla_due: parseDate(row.sla_due),
          sla_risk: mapSlaRisk(row.sla_risk),
          scheduled_date: scheduledDate,
          scheduled_time: trimCell(row.scheduled_time) || undefined,
          estimated_duration_hrs: parseNum(row.estimated_duration_hrs) ?? 2,
          actual_duration_hrs: parseNum(row.actual_duration_hrs),
          started_at: parseDate(row.started_at),
          completed_at: parseDate(row.completed_at),
          travel_distance_km: parseNum(row.travel_distance_km),
          labor_cost: parseNum(row.labor_cost),
          equipment_cost: parseNum(row.equipment_cost),
          travel_cost: parseNum(row.travel_cost),
          total_cost: parseNum(row.total_cost),
          customer_rating: parseNum(row.customer_rating),
          notes: trimCell(row.notes) || undefined,
          attachments,
          dispatch_score: parseNum(row.dispatch_score),
          project_id: optFk(row.project_id),
          project_step_id: trimCell(row.project_step_id) || undefined,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          order_number: trimCell(row.order_number),
          title: trimCell(row.title) || trimCell(row.order_number),
          description: trimCell(row.description) || undefined,
          status: mapWorkOrderStatus(row.status),
          stuck_reason_id: optFk(row.stuck_reason_id),
          stuck_reason_name: trimCell(row.stuck_reason_name) || undefined,
          stuck_note: trimCell(row.stuck_note) || undefined,
          priority: mapWorkOrderPriority(row.priority),
          service_type: mapWorkOrderServiceType(row.service_type),
          required_skills: requiredSkills,
          customer_name: trimCell(row.customer_name) || undefined,
          customer_id: optFk(row.customer_id),
          site_name: trimCell(row.site_name) || undefined,
          site_id: optFk(row.site_id),
          site_latitude: parseNum(row.site_latitude),
          site_longitude: parseNum(row.site_longitude),
          zone_name: trimCell(row.zone_name) || undefined,
          assigned_technician_id: optFk(row.assigned_technician_id),
          assigned_technician_name: trimCell(row.assigned_technician_name) || undefined,
          sla_due: parseDate(row.sla_due),
          sla_risk: mapSlaRisk(row.sla_risk),
          scheduled_date: scheduledDate,
          scheduled_time: trimCell(row.scheduled_time) || undefined,
          estimated_duration_hrs: parseNum(row.estimated_duration_hrs) ?? 2,
          actual_duration_hrs: parseNum(row.actual_duration_hrs),
          started_at: parseDate(row.started_at),
          completed_at: parseDate(row.completed_at),
          travel_distance_km: parseNum(row.travel_distance_km),
          labor_cost: parseNum(row.labor_cost),
          equipment_cost: parseNum(row.equipment_cost),
          travel_cost: parseNum(row.travel_cost),
          total_cost: parseNum(row.total_cost),
          customer_rating: parseNum(row.customer_rating),
          notes: trimCell(row.notes) || undefined,
          attachments,
          dispatch_score: parseNum(row.dispatch_score),
          project_id: optFk(row.project_id),
          project_step_id: trimCell(row.project_step_id) || undefined,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const stepPath = path.join(dir, 'WorkOrderStepData_export.csv');
  if (fs.existsSync(stepPath)) {
    for (const row of readCsvRows(stepPath)) {
      const valueMaterials = parseJson(row.value_materials, []);
      const vb = trimCell(row.value_boolean).toLowerCase();
      const valueBoolean =
        vb === 'true' || vb === '1' ? true : vb === 'false' || vb === '0' ? false : undefined;
      await prisma.workOrderStepData.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          work_order_id: trimCell(row.work_order_id),
          work_order_number: trimCell(row.work_order_number) || undefined,
          step_id: trimCell(row.step_id),
          step_name: trimCell(row.step_name) || undefined,
          task_id: trimCell(row.task_id),
          task_label: trimCell(row.task_label) || undefined,
          task_type: trimCell(row.task_type) || undefined,
          value_text: trimCell(row.value_text) || undefined,
          value_boolean: valueBoolean,
          value_file_url: trimCell(row.value_file_url) || undefined,
          value_file_name: trimCell(row.value_file_name) || undefined,
          value_materials: valueMaterials,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          work_order_id: trimCell(row.work_order_id),
          work_order_number: trimCell(row.work_order_number) || undefined,
          step_id: trimCell(row.step_id),
          step_name: trimCell(row.step_name) || undefined,
          task_id: trimCell(row.task_id),
          task_label: trimCell(row.task_label) || undefined,
          task_type: trimCell(row.task_type) || undefined,
          value_text: trimCell(row.value_text) || undefined,
          value_boolean: valueBoolean,
          value_file_url: trimCell(row.value_file_url) || undefined,
          value_file_name: trimCell(row.value_file_name) || undefined,
          value_materials: valueMaterials,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  const notifPath = path.join(dir, 'Notification_export.csv');
  if (fs.existsSync(notifPath)) {
    for (const row of readCsvRows(notifPath)) {
      const meta: Prisma.JsonObject = {};
      if (trimCell(row.category)) meta.category = trimCell(row.category);
      if (trimCell(row.related_entity_id)) meta.related_entity_id = trimCell(row.related_entity_id);
      if (trimCell(row.related_entity_type)) meta.related_entity_type = trimCell(row.related_entity_type);
      if (trimCell(row.target_user)) meta.target_user = trimCell(row.target_user);
      await prisma.notification.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          title: trimCell(row.title) || 'Notification',
          message: trimCell(row.message) || '',
          type: mapNotificationType(row.type),
          is_read: parseBool(row.is_read, false),
          target_user: trimCell(row.target_user) || undefined,
          category: trimCell(row.category) || undefined,
          related_entity_type: trimCell(row.related_entity_type) || undefined,
          related_entity_id: trimCell(row.related_entity_id) || undefined,
          meta: Object.keys(meta).length ? meta : undefined,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
        update: {
          title: trimCell(row.title) || 'Notification',
          message: trimCell(row.message) || '',
          type: mapNotificationType(row.type),
          is_read: parseBool(row.is_read, false),
          target_user: trimCell(row.target_user) || undefined,
          category: trimCell(row.category) || undefined,
          related_entity_type: trimCell(row.related_entity_type) || undefined,
          related_entity_id: trimCell(row.related_entity_id) || undefined,
          meta: Object.keys(meta).length ? meta : undefined,
          created_date: parseDate(row.created_date) ?? undefined,
          updated_date: parseDate(row.updated_date) ?? undefined,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('[seed] CSV import finished.');
}
