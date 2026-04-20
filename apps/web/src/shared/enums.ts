export const WORK_ORDER_STATUS = [
  'created',
  'assigned',
  'accepted',
  'traveling',
  'on_site',
  'working',
  'stuck',
  'completed',
  'cancelled',
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUS)[number];

export const WORK_ORDER_PRIORITY = ['critical', 'high', 'medium', 'low'] as const;
export type WorkOrderPriority = (typeof WORK_ORDER_PRIORITY)[number];

export const WORK_ORDER_SERVICE_TYPE = [
  'installation',
  'maintenance',
  'repair',
  'inspection',
  'emergency',
  'upgrade',
  'removal',
] as const;
export type WorkOrderServiceType = (typeof WORK_ORDER_SERVICE_TYPE)[number];

export const SLA_RISK = ['low', 'medium', 'high'] as const;
export type SlaRisk = (typeof SLA_RISK)[number];

export const TECHNICIAN_STATUS = ['active', 'inactive', 'on_leave', 'suspended'] as const;
export type TechnicianStatus = (typeof TECHNICIAN_STATUS)[number];

export const TECHNICIAN_AVAILABILITY = ['available', 'busy', 'offline', 'break'] as const;
export type TechnicianAvailability = (typeof TECHNICIAN_AVAILABILITY)[number];

export const ATTENDANCE_STATUS = ['scheduled', 'checked_in', 'checked_out', 'absent'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

export const MEMBER_SKILL_CERT_STATUS = ['pending', 'approved', 'rejected', 'expired'] as const;
export type MemberSkillCertStatus = (typeof MEMBER_SKILL_CERT_STATUS)[number];

export const PROJECT_STATUS = [
  'planning',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const STUCK_REASON_CATEGORY = [
  'parts',
  'access',
  'technical',
  'customer',
  'weather',
  'other',
] as const;
export type StuckReasonCategory = (typeof STUCK_REASON_CATEGORY)[number];

export const CUSTOMER_TYPE = [
  'residential',
  'commercial',
  'industrial',
  'government',
] as const;
export type CustomerType = (typeof CUSTOMER_TYPE)[number];

export const SITE_TYPE = [
  'office',
  'warehouse',
  'factory',
  'retail',
  'residential',
  'data_center',
  'outdoor',
] as const;
export type SiteType = (typeof SITE_TYPE)[number];

export const MATERIAL_ITEM_TYPE = ['item', 'service'] as const;
export type MaterialItemType = (typeof MATERIAL_ITEM_TYPE)[number];

export const USER_ROLE = ['admin', 'dispatcher', 'supervisor', 'technician', 'viewer'] as const;
export type UserRole = (typeof USER_ROLE)[number];
