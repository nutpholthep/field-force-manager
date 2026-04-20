import { z } from 'zod';
import {
  ATTENDANCE_STATUS,
  CUSTOMER_TYPE,
  MATERIAL_ITEM_TYPE,
  MEMBER_SKILL_CERT_STATUS,
  PROJECT_STATUS,
  SITE_TYPE,
  SLA_RISK,
  STUCK_REASON_CATEGORY,
  TECHNICIAN_AVAILABILITY,
  TECHNICIAN_STATUS,
  WORK_ORDER_PRIORITY,
  WORK_ORDER_SERVICE_TYPE,
  WORK_ORDER_STATUS,
} from '../enums';

const nullableString = () => z.string().nullable().optional();
const nullableNumber = () => z.number().nullable().optional();

export const customerSchema = z.object({
  name: z.string().min(1),
  contact_person: nullableString(),
  email: z.string().email().nullable().optional(),
  phone: nullableString(),
  address: nullableString(),
  type: z.enum(CUSTOMER_TYPE).default('commercial'),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const siteSchema = z.object({
  name: z.string().min(1),
  customer_id: nullableString(),
  customer_name: nullableString(),
  address: nullableString(),
  zone_id: nullableString(),
  zone_name: nullableString(),
  site_type: z.enum(SITE_TYPE).default('office'),
  equipment: z.array(z.string()).default([]),
  access_instructions: nullableString(),
  status: z.enum(['active', 'inactive']).default('active'),
  latitude: nullableNumber(),
  longitude: nullableNumber(),
});
export type SiteInput = z.infer<typeof siteSchema>;

export const zoneSchema = z.object({
  name: z.string().min(1),
  code: nullableString(),
  description: nullableString(),
  color: z.string().default('#3b82f6'),
  polygon: z.array(z.tuple([z.number(), z.number()])).default([]),
  center_latitude: nullableNumber(),
  center_longitude: nullableNumber(),
  agent_id: nullableString(),
  agent_name: nullableString(),
  is_active: z.boolean().default(true),
});
export type ZoneInput = z.infer<typeof zoneSchema>;

export const skillSchema = z.object({
  name: z.string().min(1),
  description: nullableString(),
  category: nullableString(),
});
export type SkillInput = z.infer<typeof skillSchema>;

export const priorityMasterSchema = z.object({
  name: z.string().min(1),
  code: nullableString(),
  color: z.string().default('#3b82f6'),
  duration_value: z.number().default(4),
  duration_unit: z.enum(['minutes', 'hours', 'days']).default('hours'),
  description: nullableString(),
  is_active: z.boolean().default(true),
});
export type PriorityMasterInput = z.infer<typeof priorityMasterSchema>;

export const stuckReasonSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.enum(STUCK_REASON_CATEGORY).default('other'),
  description: nullableString(),
  color: z.string().default('#f59e0b'),
  is_active: z.boolean().default(true),
});
export type StuckReasonInput = z.infer<typeof stuckReasonSchema>;

export const materialCategorySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: nullableString(),
  color: z.string().default('#3b82f6'),
  is_active: z.boolean().default(true),
});
export type MaterialCategoryInput = z.infer<typeof materialCategorySchema>;

export const materialSchema = z.object({
  item_number: z.string().min(1),
  item_name: z.string().min(1),
  description: nullableString(),
  category_id: nullableString(),
  category_name: nullableString(),
  item_group: nullableString(),
  item_type: z.enum(MATERIAL_ITEM_TYPE).default('item'),
  unit: nullableString(),
  warehouse: nullableString(),
  stock_qty: z.number().default(0),
  min_stock_qty: z.number().default(0),
  cost_price: nullableNumber(),
  keywords: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});
export type MaterialInput = z.infer<typeof materialSchema>;

export const serviceTypeSchema = z.object({
  name: z.string().min(1),
  code: nullableString(),
  description: nullableString(),
  required_skill_ids: z.array(z.string()).default([]),
  allowed_priority_ids: z.array(z.string()).default([]),
  default_priority_id: nullableString(),
  default_duration_hrs: z.number().default(2),
  steps: z.array(z.any()).default([]),
  causes: z.array(z.any()).default([]),
  is_active: z.boolean().default(true),
});
export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>;

export const workflowSchema = z.object({
  name: z.string().min(1),
  description: nullableString(),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
  is_active: z.boolean().default(true),
});
export type WorkflowInput = z.infer<typeof workflowSchema>;

export const teamRoleSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  color: nullableString(),
  description: nullableString(),
  is_active: z.boolean().default(true),
});
export type TeamRoleInput = z.infer<typeof teamRoleSchema>;

export const teamSchema = z.object({
  name: z.string().min(1),
  code: nullableString(),
  description: nullableString(),
  zone_id: nullableString(),
  zone_name: nullableString(),
  is_active: z.boolean().default(true),
});
export type TeamInput = z.infer<typeof teamSchema>;

export const technicianSchema = z.object({
  technician_code: z.string().min(1),
  full_name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: nullableString(),
  photo_url: nullableString(),
  linked_user_id: nullableString(),
  linked_user_email: nullableString(),
  status: z.enum(TECHNICIAN_STATUS).default('active'),
  team_role: nullableString(),
  team_role_name: nullableString(),
  team_id: nullableString(),
  team_name: nullableString(),
  home_latitude: nullableNumber(),
  home_longitude: nullableNumber(),
  current_latitude: nullableNumber(),
  current_longitude: nullableNumber(),
  zone_id: nullableString(),
  zone_name: nullableString(),
  skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  max_daily_jobs: z.number().default(6),
  current_daily_jobs: z.number().default(0),
  avg_completion_time_hrs: nullableNumber(),
  sla_compliance_rate: nullableNumber(),
  customer_rating: nullableNumber(),
  jobs_completed_total: z.number().default(0),
  performance_score: nullableNumber(),
  availability: z.enum(TECHNICIAN_AVAILABILITY).default('available'),
  working_hours_start: z.string().default('08:00'),
  working_hours_end: z.string().default('17:00'),
  hourly_rate: nullableNumber(),
});
export type TechnicianInput = z.infer<typeof technicianSchema>;

export const memberSkillCertSchema = z.object({
  technician_id: z.string().min(1),
  technician_name: nullableString(),
  skill_id: z.string().min(1),
  skill_name: z.string().min(1),
  cert_file_url: nullableString(),
  cert_file_name: nullableString(),
  issued_date: nullableString(),
  expiry_date: nullableString(),
  status: z.enum(MEMBER_SKILL_CERT_STATUS).default('pending'),
  reviewer_note: nullableString(),
});
export type MemberSkillCertInput = z.infer<typeof memberSkillCertSchema>;

export const technicianAttendanceSchema = z.object({
  technician_id: z.string().min(1),
  technician_name: nullableString(),
  technician_code: nullableString(),
  date: z.string().min(1),
  status: z.enum(ATTENDANCE_STATUS).default('scheduled'),
  check_in_time: nullableString(),
  check_out_time: nullableString(),
  check_in_at: nullableString(),
  check_out_at: nullableString(),
  work_hours: nullableNumber(),
  scheduled_jobs: z.number().default(0),
  notes: nullableString(),
});
export type TechnicianAttendanceInput = z.infer<typeof technicianAttendanceSchema>;

export const workOrderSchema = z.object({
  order_number: z.string().min(1),
  title: z.string().min(1),
  description: nullableString(),
  status: z.enum(WORK_ORDER_STATUS).default('created'),
  stuck_reason_id: nullableString(),
  stuck_reason_name: nullableString(),
  stuck_note: nullableString(),
  priority: z.enum(WORK_ORDER_PRIORITY).default('medium'),
  service_type: z.enum(WORK_ORDER_SERVICE_TYPE).default('maintenance'),
  required_skills: z.array(z.string()).default([]),
  customer_name: nullableString(),
  customer_id: nullableString(),
  site_name: nullableString(),
  site_id: nullableString(),
  site_latitude: nullableNumber(),
  site_longitude: nullableNumber(),
  zone_name: nullableString(),
  assigned_technician_id: nullableString(),
  assigned_technician_name: nullableString(),
  sla_due: nullableString(),
  sla_risk: z.enum(SLA_RISK).default('low'),
  scheduled_date: nullableString(),
  scheduled_time: nullableString(),
  estimated_duration_hrs: z.number().default(2),
  actual_duration_hrs: nullableNumber(),
  started_at: nullableString(),
  completed_at: nullableString(),
  travel_distance_km: nullableNumber(),
  labor_cost: nullableNumber(),
  equipment_cost: nullableNumber(),
  travel_cost: nullableNumber(),
  total_cost: nullableNumber(),
  customer_rating: nullableNumber(),
  notes: nullableString(),
  attachments: z.array(z.string()).default([]),
  dispatch_score: nullableNumber(),
  project_id: nullableString(),
  project_step_id: nullableString(),
});
export type WorkOrderInput = z.infer<typeof workOrderSchema>;

export const workOrderMaterialSchema = z.object({
  work_order_id: z.string().min(1),
  work_order_number: nullableString(),
  material_id: z.string().min(1),
  item_number: nullableString(),
  item_name: nullableString(),
  unit: nullableString(),
  quantity_used: z.number().default(1),
  cost_price: nullableNumber(),
  total_cost: nullableNumber(),
  notes: nullableString(),
});
export type WorkOrderMaterialInput = z.infer<typeof workOrderMaterialSchema>;

export const workOrderStepDataSchema = z.object({
  work_order_id: z.string().min(1),
  work_order_number: nullableString(),
  step_id: z.string().min(1),
  step_name: nullableString(),
  task_id: z.string().min(1),
  task_label: nullableString(),
  task_type: nullableString(),
  value_text: nullableString(),
  value_boolean: z.boolean().nullable().optional(),
  value_file_url: nullableString(),
  value_file_name: nullableString(),
  value_materials: z.array(z.any()).default([]),
});
export type WorkOrderStepDataInput = z.infer<typeof workOrderStepDataSchema>;

export const projectSchema = z.object({
  project_number: nullableString(),
  name: z.string().min(1),
  description: nullableString(),
  customer_id: nullableString(),
  customer_name: nullableString(),
  site_id: nullableString(),
  site_name: nullableString(),
  workflow_id: z.string().min(1),
  workflow_name: nullableString(),
  current_step_id: nullableString(),
  current_step_name: nullableString(),
  status: z.enum(PROJECT_STATUS).default('planning'),
  priority: z.enum(WORK_ORDER_PRIORITY).default('medium'),
  assigned_technician_id: nullableString(),
  assigned_technician_name: nullableString(),
  start_date: nullableString(),
  target_date: nullableString(),
  completed_date: nullableString(),
  completed_steps: z.array(z.string()).default([]),
  step_history: z.array(z.any()).default([]),
  notes: nullableString(),
  tags: z.array(z.string()).default([]),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const notificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  is_read: z.boolean().default(false),
  user_id: nullableString(),
  link: nullableString(),
  meta: z.record(z.any()).nullable().optional(),
});
export type NotificationInput = z.infer<typeof notificationSchema>;

export const aiAgentSchema = z.object({
  name: z.string().min(1),
  description: nullableString(),
  model: nullableString(),
  system_prompt: nullableString(),
  config: z.record(z.any()).default({}),
  assigned_zone_ids: z.array(z.string()).default([]),
  assigned_zone_names: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});
export type AIAgentInput = z.infer<typeof aiAgentSchema>;
