'use client';

import {
  AlertOctagon,
  BarChart3,
  Bell,
  Bot,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flag,
  FolderKanban,
  GitBranch,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Radio,
  Send,
  Settings,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { entities } from '@/lib/entity-client';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Work Orders', href: '/work-orders', icon: ClipboardList },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Workflows', href: '/config/workflows', icon: GitBranch },
  { name: 'Stock / Material', href: '/stock', icon: Package },
  { name: 'Dispatch', href: '/dispatch', icon: Send },
  { name: 'GIS Monitor', href: '/gis-monitor', icon: Radio },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Users', href: '/users', icon: Users },
];

const configItems: NavItem[] = [
  { name: 'Priority Master', href: '/master/priority', icon: Flag },
  { name: 'Service Types', href: '/config/service-types', icon: Wrench },
  { name: 'Skills', href: '/master/skills', icon: Zap },
  { name: 'หมวดหมู่ Material', href: '/master/material-categories', icon: Package },
  { name: 'Stuck Reasons', href: '/master/stuck-reasons', icon: AlertOctagon },
  { name: 'Zones', href: '/zones', icon: MapPin },
  { name: 'Customers', href: '/customers', icon: Building2 },
  { name: 'Sites', href: '/sites', icon: Landmark },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'AI Agents', href: '/agents', icon: Bot },
];

const configPrefixes = ['/master', '/config', '/zones', '/customers', '/sites', '/team', '/schedule', '/agents'];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(() =>
    configPrefixes.some((p) => pathname.startsWith(p)),
  );

  useEffect(() => {
    if (configPrefixes.some((p) => pathname.startsWith(p))) setConfigOpen(true);
  }, [pathname]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => entities.Notification.filter({ is_read: false }, undefined, 100),
    refetchInterval: 60_000,
  });

  const unreadCount = notifications.length;
  const allItems = [...navItems, ...configItems];
  const currentTitle =
    allItems.find((i) => i.href === pathname || pathname.startsWith(`${i.href}/`))?.name ?? 'Dashboard';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 ${collapsed ? 'w-[72px]' : 'w-[260px]'} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } bg-[#0f172a] text-white transition-all duration-300 flex flex-col`}
      >
        <div
          className={`h-16 flex items-center border-b border-white/10 ${
            collapsed ? 'justify-center px-2' : 'px-5'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">
              iCF
            </div>
            {!collapsed && (
              <div>
                <div className="font-semibold text-sm tracking-wide">iCrewForce</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Management
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <div className={`${collapsed ? 'px-2' : 'px-3'} space-y-1`}>
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-3 rounded-lg transition-all duration-200 ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                  } ${active ? 'bg-blue-500/15 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              );
            })}

            {!collapsed && (
              <div>
                <button
                  onClick={() => setConfigOpen((o) => !o)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Settings className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">Configuration</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      configOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {configOpen && (
                  <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-0.5">
                    {configItems.map((item) => {
                      const active = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-sm ${
                            active
                              ? 'bg-blue-500/15 text-blue-400'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {collapsed && (
              <div className="space-y-1">
                {configItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={item.name}
                      className={`flex items-center justify-center px-2 py-2.5 rounded-lg ${
                        active
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden lg:flex border-t border-white/10 p-3 justify-center">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">{currentTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push('/notifications')}
            >
              <Bell className="w-[18px] h-[18px] text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            {user && (
              <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">
                    {user.full_name?.[0] ?? user.email?.[0] ?? 'U'}
                  </span>
                </div>
                <span className="text-sm text-slate-700 font-medium">
                  {user.full_name || user.email}
                </span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-auto">{children}</main>
      </div>
    </div>
  );
}
