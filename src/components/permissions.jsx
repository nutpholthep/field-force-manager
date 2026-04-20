/**
 * Role-based permission system
 */

export const PAGE_LIST = [
  "Dashboard",
  "WorkOrders",
  "Dispatch",
  "Technicians",
  "Schedule",
  "Zones",
  "Customers",
  "Sites",
  "Analytics",
  "MasterData",
  "Agents",
  "UserManagement",
  "Notifications",
];

export const ACTIONS = ["create", "edit", "delete", "view"];

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    pages: PAGE_LIST,
    actions: { create: true, edit: true, delete: true, view: true },
  },
  manager: {
    pages: ["Dashboard", "WorkOrders", "Dispatch", "Technicians", "Schedule", "Zones", "Customers", "Sites", "Analytics", "Notifications"],
    actions: { create: true, edit: true, delete: false, view: true },
  },
  dispatcher: {
    pages: ["Dashboard", "WorkOrders", "Dispatch", "Technicians", "Schedule", "Notifications"],
    actions: { create: true, edit: true, delete: false, view: true },
  },
  viewer: {
    pages: ["Dashboard", "WorkOrders", "Technicians", "Schedule", "Analytics", "Notifications"],
    actions: { create: false, edit: false, delete: false, view: true },
  },
  user: {
    pages: ["Dashboard", "WorkOrders", "Notifications"],
    actions: { create: false, edit: false, delete: false, view: true },
  },
};

const STORAGE_KEY = "wfm_role_permissions";

export function loadPermissions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
}

export function savePermissions(perms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(perms));
}

export function getRolePermissions(role) {
  const perms = loadPermissions();
  return perms[role] || DEFAULT_ROLE_PERMISSIONS["user"];
}

export function canAccessPage(role, page) {
  if (role === "admin") return true;
  const perms = getRolePermissions(role);
  return perms.pages?.includes(page) ?? false;
}

export function canDoAction(role, action) {
  if (role === "admin") return true;
  const perms = getRolePermissions(role);
  return perms.actions?.[action] ?? false;
}