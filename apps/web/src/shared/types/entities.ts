import type {
  AttendanceStatus,
  CustomerType,
  MaterialItemType,
  MemberSkillCertStatus,
  ProjectStatus,
  SiteType,
  SlaRisk,
  StuckReasonCategory,
  TechnicianAvailability,
  TechnicianStatus,
  WorkOrderPriority,
  WorkOrderServiceType,
  WorkOrderStatus,
} from '../enums';
import type { BaseEntity, Iso8601Date, Iso8601DateTime } from './base';

export interface Customer extends BaseEntity {
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  type: CustomerType;
}

export interface Site extends BaseEntity {
  name: string;
  customer_id?: string | null;
  customer_name?: string | null;
  address?: string | null;
  zone_id?: string | null;
  zone_name?: string | null;
  site_type: SiteType;
  equipment: string[];
  access_instructions?: string | null;
  status: 'active' | 'inactive';
  latitude?: number | null;
  longitude?: number | null;
}

export interface Zone extends BaseEntity {
  name: string;
  code?: string | null;
  description?: string | null;
  color: string;
  polygon: Array<[number, number]>;
  center_latitude?: number | null;
  center_longitude?: number | null;
  agent_id?: string | null;
  agent_name?: string | null;
  is_active: boolean;
}

export interface Skill extends BaseEntity {
  name: string;
  description?: string | null;
  category?: string | null;
}

export interface PriorityMaster extends BaseEntity {
  name: string;
  code?: string | null;
  color: string;
  duration_value: number;
  duration_unit: 'minutes' | 'hours' | 'days';
  description?: string | null;
  is_active: boolean;
}

export interface StuckReason extends BaseEntity {
  name: string;
  code: string;
  category: StuckReasonCategory;
  description?: string | null;
  color: string;
  is_active: boolean;
}

export interface MaterialCategory extends BaseEntity {
  name: string;
  code: string;
  description?: string | null;
  color: string;
  is_active: boolean;
}

export interface Material extends BaseEntity {
  item_number: string;
  item_name: string;
  description?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  item_group?: string | null;
  item_type: MaterialItemType;
  unit?: string | null;
  warehouse?: string | null;
  stock_qty: number;
  min_stock_qty: number;
  cost_price?: number | null;
  keywords: string[];
  is_active: boolean;
}

export interface ServiceTypeStep {
  step_id: string;
  step_name: string;
  order: number;
  tasks: Array<{
    task_id: string;
    task_label: string;
    task_type: 'text' | 'date' | 'photo' | 'file' | 'scan' | 'number' | 'checkbox' | 'material';
    required?: boolean;
    options?: string[];
  }>;
}

export interface ServiceType extends BaseEntity {
  name: string;
  code?: string | null;
  description?: string | null;
  required_skill_ids: string[];
  allowed_priority_ids: string[];
  default_priority_id?: string | null;
  default_duration_hrs: number;
  steps: ServiceTypeStep[];
  causes: Array<{ id: string; name: string }>;
  is_active: boolean;
}

export interface WorkflowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow extends BaseEntity {
  name: string;
  description?: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  is_active: boolean;
}

export interface TeamRole extends BaseEntity {
  name: string;
  code: string;
  color?: string | null;
  description?: string | null;
  is_active: boolean;
}

export interface Team extends BaseEntity {
  name: string;
  code?: string | null;
  description?: string | null;
  zone_id?: string | null;
  zone_name?: string | null;
  is_active: boolean;
}

export interface Technician extends BaseEntity {
  technician_code: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  linked_user_id?: string | null;
  linked_user_email?: string | null;
  status: TechnicianStatus;
  team_role?: string | null;
  team_role_name?: string | null;
  team_id?: string | null;
  team_name?: string | null;
  home_latitude?: number | null;
  home_longitude?: number | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  zone_id?: string | null;
  zone_name?: string | null;
  skills: string[];
  certifications: string[];
  max_daily_jobs: number;
  current_daily_jobs: number;
  avg_completion_time_hrs?: number | null;
  sla_compliance_rate?: number | null;
  customer_rating?: number | null;
  jobs_completed_total: number;
  performance_score?: number | null;
  availability: TechnicianAvailability;
  working_hours_start: string;
  working_hours_end: string;
  hourly_rate?: number | null;
}

export interface MemberSkillCert extends BaseEntity {
  technician_id: string;
  technician_name?: string | null;
  skill_id: string;
  skill_name: string;
  cert_file_url?: string | null;
  cert_file_name?: string | null;
  issued_date?: Iso8601Date | null;
  expiry_date?: Iso8601Date | null;
  status: MemberSkillCertStatus;
  reviewer_note?: string | null;
}

export interface TechnicianAttendance extends BaseEntity {
  technician_id: string;
  technician_name?: string | null;
  technician_code?: string | null;
  date: Iso8601Date;
  status: AttendanceStatus;
  check_in_time?: string | null;
  check_out_time?: string | null;
  check_in_at?: Iso8601DateTime | null;
  check_out_at?: Iso8601DateTime | null;
  work_hours?: number | null;
  scheduled_jobs: number;
  notes?: string | null;
}

export interface WorkOrder extends BaseEntity {
  order_number: string;
  title: string;
  description?: string | null;
  status: WorkOrderStatus;
  stuck_reason_id?: string | null;
  stuck_reason_name?: string | null;
  stuck_note?: string | null;
  priority: WorkOrderPriority;
  service_type: WorkOrderServiceType;
  required_skills: string[];
  customer_name?: string | null;
  customer_id?: string | null;
  site_name?: string | null;
  site_id?: string | null;
  site_latitude?: number | null;
  site_longitude?: number | null;
  zone_name?: string | null;
  assigned_technician_id?: string | null;
  assigned_technician_name?: string | null;
  sla_due?: Iso8601DateTime | null;
  sla_risk: SlaRisk;
  scheduled_date?: Iso8601Date | null;
  scheduled_time?: string | null;
  estimated_duration_hrs: number;
  actual_duration_hrs?: number | null;
  started_at?: Iso8601DateTime | null;
  completed_at?: Iso8601DateTime | null;
  travel_distance_km?: number | null;
  labor_cost?: number | null;
  equipment_cost?: number | null;
  travel_cost?: number | null;
  total_cost?: number | null;
  customer_rating?: number | null;
  notes?: string | null;
  attachments: string[];
  dispatch_score?: number | null;
  project_id?: string | null;
  project_step_id?: string | null;
}

export interface WorkOrderMaterial extends BaseEntity {
  work_order_id: string;
  work_order_number?: string | null;
  material_id: string;
  item_number?: string | null;
  item_name?: string | null;
  unit?: string | null;
  quantity_used: number;
  cost_price?: number | null;
  total_cost?: number | null;
  notes?: string | null;
}

export interface WorkOrderStepData extends BaseEntity {
  work_order_id: string;
  work_order_number?: string | null;
  step_id: string;
  step_name?: string | null;
  task_id: string;
  task_label?: string | null;
  task_type?: string | null;
  value_text?: string | null;
  value_boolean?: boolean | null;
  value_file_url?: string | null;
  value_file_name?: string | null;
  value_materials: Array<Record<string, unknown>>;
}

export interface Project extends BaseEntity {
  project_number?: string | null;
  name: string;
  description?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  site_id?: string | null;
  site_name?: string | null;
  workflow_id: string;
  workflow_name?: string | null;
  current_step_id?: string | null;
  current_step_name?: string | null;
  status: ProjectStatus;
  priority: WorkOrderPriority;
  assigned_technician_id?: string | null;
  assigned_technician_name?: string | null;
  start_date?: Iso8601Date | null;
  target_date?: Iso8601Date | null;
  completed_date?: Iso8601Date | null;
  completed_steps: string[];
  step_history: Array<{
    step_id: string;
    step_name: string;
    completed_at: Iso8601DateTime;
    notes?: string;
  }>;
  notes?: string | null;
  tags: string[];
}

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  user_id?: string | null;
  link?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface AIAgent extends BaseEntity {
  name: string;
  description?: string | null;
  model?: string | null;
  system_prompt?: string | null;
  config: Record<string, unknown>;
  assigned_zone_ids: string[];
  assigned_zone_names: string[];
  is_active: boolean;
}
