export const PAGE_LIST = [
  'Dashboard',
  'WorkOrders',
  'Projects',
  'ConfigWorkflows',
  'StockManagement',
  'Dispatch',
  'GISMonitor',
  'Technicians',
  'Schedule',
  'Zones',
  'Customers',
  'Sites',
  'Team',
  'Analytics',
  'MasterData',
  'MasterPriority',
  'MasterSkills',
  'MasterMaterialCategories',
  'MasterStuckReasons',
  'ConfigServiceTypes',
  'ConfigSkills',
  'ConfigPriority',
  'Agents',
  'UserManagement',
  'Notifications',
] as const;

export type PageName = (typeof PAGE_LIST)[number];

export const ACTIONS = ['create', 'edit', 'delete', 'view'] as const;
export type Action = (typeof ACTIONS)[number];

export type Role = 'admin' | 'manager' | 'dispatcher' | 'viewer' | 'user';

export interface RolePermission {
  pages: string[];
  actions: Record<Action, boolean>;
}

export type PermissionsMap = Record<Role, RolePermission>;

export const DEFAULT_ROLE_PERMISSIONS: PermissionsMap = {
  admin: {
    pages: [...PAGE_LIST],
    actions: { create: true, edit: true, delete: true, view: true },
  },
  manager: {
    pages: [
      'Dashboard',
      'WorkOrders',
      'Projects',
      'ConfigWorkflows',
      'StockManagement',
      'Dispatch',
      'GISMonitor',
      'Technicians',
      'Schedule',
      'Zones',
      'Customers',
      'Sites',
      'Team',
      'Analytics',
      'Notifications',
    ],
    actions: { create: true, edit: true, delete: false, view: true },
  },
  dispatcher: {
    pages: [
      'Dashboard',
      'WorkOrders',
      'Dispatch',
      'Technicians',
      'Schedule',
      'GISMonitor',
      'Notifications',
    ],
    actions: { create: true, edit: true, delete: false, view: true },
  },
  viewer: {
    pages: ['Dashboard', 'WorkOrders', 'Technicians', 'Schedule', 'Analytics', 'Notifications'],
    actions: { create: false, edit: false, delete: false, view: true },
  },
  user: {
    pages: ['Dashboard', 'WorkOrders', 'Notifications'],
    actions: { create: false, edit: false, delete: false, view: true },
  },
};

const STORAGE_KEY = 'wfm_role_permissions';

export function loadPermissions(): PermissionsMap {
  if (typeof window === 'undefined') return clonePerms(DEFAULT_ROLE_PERMISSIONS);
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as PermissionsMap;
  } catch {
    // ignore
  }
  return clonePerms(DEFAULT_ROLE_PERMISSIONS);
}

export function savePermissions(perms: PermissionsMap) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(perms));
}

function clonePerms(p: PermissionsMap): PermissionsMap {
  return JSON.parse(JSON.stringify(p)) as PermissionsMap;
}

export function getRolePermissions(role: string): RolePermission {
  const perms = loadPermissions();
  return (perms as Record<string, RolePermission>)[role] ?? DEFAULT_ROLE_PERMISSIONS.user;
}

export function canAccessPage(role: string, page: string): boolean {
  if (role === 'admin') return true;
  const perms = getRolePermissions(role);
  return perms.pages?.includes(page) ?? false;
}

export function canDoAction(role: string, action: string): boolean {
  if (role === 'admin') return true;
  const perms = getRolePermissions(role);
  return (perms.actions as Record<string, boolean>)?.[action] ?? false;
}
