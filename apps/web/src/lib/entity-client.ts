import { http } from './api';

export interface EntityClient<T> {
  list(sort?: string, limit?: number, offset?: number, where?: Record<string, unknown>): Promise<T[]>;
  filter(where: Record<string, unknown>, sort?: string, limit?: number): Promise<T[]>;
  findById(id: string): Promise<T>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

function buildListParams(
  sort?: string,
  limit?: number,
  offset?: number,
  where?: Record<string, unknown>,
) {
  const params: Record<string, string | number> = {};
  if (sort) params.sort = sort;
  if (typeof limit === 'number') params.limit = limit;
  if (typeof offset === 'number') params.offset = offset;
  if (where && Object.keys(where).length > 0) params.where = JSON.stringify(where);
  return params;
}

function createEntityClient<T>(path: string): EntityClient<T> {
  return {
    async list(sort, limit = 100, offset = 0, where) {
      const { data } = await http.get<T[]>(`/${path}`, {
        params: buildListParams(sort, limit, offset, where),
      });
      return data;
    },
    async filter(where, sort, limit = 100) {
      const { data } = await http.get<T[]>(`/${path}`, {
        params: buildListParams(sort, limit, 0, where),
      });
      return data;
    },
    async findById(id) {
      const { data } = await http.get<T>(`/${path}/${id}`);
      return data;
    },
    async create(payload) {
      const { data } = await http.post<T>(`/${path}`, payload);
      return data;
    },
    async update(id, payload) {
      const { data } = await http.patch<T>(`/${path}/${id}`, payload);
      return data;
    },
    async delete(id) {
      await http.delete(`/${path}/${id}`);
    },
  };
}

import type {
  AIAgent,
  Customer,
  MaterialCategory,
  Material,
  MemberSkillCert,
  Notification,
  PriorityMaster,
  Project,
  ServiceType,
  Site,
  Skill,
  StuckReason,
  Team,
  TeamRole,
  Technician,
  TechnicianAttendance,
  User,
  WorkOrder,
  WorkOrderMaterial,
  WorkOrderStepData,
  Workflow,
  Zone,
} from '@ffm/shared';

export const entities = {
  Customer: createEntityClient<Customer>('customers'),
  Site: createEntityClient<Site>('sites'),
  Zone: createEntityClient<Zone>('zones'),
  Project: createEntityClient<Project>('projects'),
  Skill: createEntityClient<Skill>('skills'),
  PriorityMaster: createEntityClient<PriorityMaster>('priorities'),
  StuckReason: createEntityClient<StuckReason>('stuck-reasons'),
  MaterialCategory: createEntityClient<MaterialCategory>('material-categories'),
  Material: createEntityClient<Material>('materials'),
  ServiceType: createEntityClient<ServiceType>('service-types'),
  Workflow: createEntityClient<Workflow>('workflows'),
  Team: createEntityClient<Team>('teams'),
  TeamRole: createEntityClient<TeamRole>('team-roles'),
  Technician: createEntityClient<Technician>('technicians'),
  MemberSkillCert: createEntityClient<MemberSkillCert>('member-skill-certs'),
  TechnicianAttendance: createEntityClient<TechnicianAttendance>('technician-attendance'),
  WorkOrder: createEntityClient<WorkOrder>('work-orders'),
  WorkOrderMaterial: createEntityClient<WorkOrderMaterial>('work-order-materials'),
  WorkOrderStepData: createEntityClient<WorkOrderStepData>('work-order-step-data'),
  Notification: createEntityClient<Notification>('notifications'),
  AIAgent: createEntityClient<AIAgent>('agents'),
  User: createEntityClient<User>('users'),
};

export type Entities = typeof entities;
