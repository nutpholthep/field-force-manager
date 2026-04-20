export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export interface ListQueryParams {
  sort?: string;
  limit?: number;
  offset?: number;
  where?: string;
}

export const ENTITY_ROUTES = {
  WorkOrder: 'work-orders',
  Technician: 'technicians',
  Customer: 'customers',
  Site: 'sites',
  Zone: 'zones',
  Project: 'projects',
  ServiceType: 'service-types',
  Workflow: 'workflows',
  Skill: 'skills',
  PriorityMaster: 'priorities',
  StuckReason: 'stuck-reasons',
  MaterialCategory: 'material-categories',
  Material: 'materials',
  Team: 'teams',
  TeamRole: 'team-roles',
  TechnicianAttendance: 'technician-attendance',
  MemberSkillCert: 'member-skill-certs',
  WorkOrderMaterial: 'work-order-materials',
  WorkOrderStepData: 'work-order-step-data',
  Notification: 'notifications',
  AIAgent: 'agents',
  User: 'users',
} as const;

export type EntityName = keyof typeof ENTITY_ROUTES;
