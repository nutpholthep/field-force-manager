/**
 * Maps original Base44 page names (used with createPageUrl) to their
 * Next.js App Router paths. This lets migrated pages keep using the
 * createPageUrl("PageName") convention with minimal edits.
 */
export const PAGE_ROUTES = {
  Dashboard: '/dashboard',
  WorkOrders: '/work-orders',
  Projects: '/projects',
  ConfigWorkflows: '/config/workflows',
  StockManagement: '/stock',
  Dispatch: '/dispatch',
  GISMonitor: '/gis-monitor',
  Analytics: '/analytics',
  UserManagement: '/users',
  Notifications: '/notifications',
  MasterData: '/master',
  MasterPriority: '/master/priority',
  MasterSkills: '/master/skills',
  MasterMaterialCategories: '/master/material-categories',
  MasterStuckReasons: '/master/stuck-reasons',
  ConfigServiceTypes: '/config/service-types',
  ConfigSkills: '/config/skills',
  ConfigPriority: '/config/priority',
  Zones: '/zones',
  Customers: '/customers',
  Sites: '/sites',
  Team: '/team',
  Schedule: '/schedule',
  Agents: '/agents',
  Technicians: '/technicians',
  Login: '/login',
} as const;

export type PageKey = keyof typeof PAGE_ROUTES;

export function createPageUrl(name: string, query?: string): string {
  const base = (PAGE_ROUTES as Record<string, string>)[name] ?? `/${name.toLowerCase()}`;
  if (!query) return base;
  return `${base}?${query.replace(/^\?/, '')}`;
}
