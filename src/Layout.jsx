import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FolderKanban,
  Send,
  Calendar,
  MapPin,
  BarChart3,
  Building2,
  Landmark,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Menu,
  X,
  Bot,
  Flag,
  Wrench,
  Zap,
  ChevronDown,
  GitBranch,
  Package,
  AlertOctagon,
  Radio
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/components/usePermissions";

const navItems = [
  { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { name: "Work Orders", page: "WorkOrders", icon: ClipboardList },
  { name: "Projects", page: "Projects", icon: FolderKanban },
  { name: "Workflows", page: "ConfigWorkflows", icon: GitBranch },
  { name: "Stock / Material", page: "StockManagement", icon: Package },
  { name: "Dispatch", page: "Dispatch", icon: Send },
  { name: "GIS Monitor", page: "GISMonitor", icon: Radio },
  { name: "Analytics", page: "Analytics", icon: BarChart3 },
  { name: "Users", page: "UserManagement", icon: Users },
];

const configItems = [
  { name: "Priority Master", page: "MasterPriority", icon: Flag },
  { name: "Service Types", page: "ConfigServiceTypes", icon: Wrench },
  { name: "Skills", page: "MasterSkills", icon: Zap },
  { name: "หมวดหมู่ Material", page: "MasterMaterialCategories", icon: Package },
  { name: "Stuck Reasons", page: "MasterStuckReasons", icon: AlertOctagon },
  { name: "Zones", page: "Zones", icon: MapPin },
  { name: "Customers", page: "Customers", icon: Building2 },
  { name: "Sites", page: "Sites", icon: Landmark },
  { name: "Team", page: "Team", icon: Users },
  { name: "Schedule", page: "Schedule", icon: Calendar },
  { name: "AI Agents", page: "Agents", icon: Bot },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(
    ["MasterPriority", "MasterSkills", "MasterMaterialCategories", "ConfigServiceTypes", "ConfigWorkflows", "Zones", "Customers", "Sites", "Team", "Schedule", "Agents"].includes(currentPageName)
  );
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { canAccess } = usePermissions();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Notification.filter({ is_read: false }).then(n => setUnreadCount(n.length)).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <style>{`
        :root {
          --wfm-primary: #0f172a;
          --wfm-accent: #3b82f6;
          --wfm-accent-light: #eff6ff;
        }
      `}</style>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${collapsed ? "w-[72px]" : "w-[260px]"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        bg-[#0f172a] text-white transition-all duration-300 flex flex-col
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-5"}`}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">
              iCF
              </div>
              <div>
                <div className="font-semibold text-sm tracking-wide">iCrewForce</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">Management</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">
              iCF
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className={`${collapsed ? "px-2" : "px-3"} space-y-1`}>
            {navItems.filter(item => canAccess(item.page)).map(item => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-lg transition-all duration-200
                    ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                    ${isActive 
                      ? "bg-blue-500/15 text-blue-400" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              );
            })}

            {/* Configuration Group */}
            {!collapsed && (
              <div>
                <button
                  onClick={() => setConfigOpen(o => !o)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <Settings className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">Configuration</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${configOpen ? "rotate-180" : ""}`} />
                </button>
                {configOpen && (
                  <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-0.5">
                    {configItems.filter(item => canAccess(item.page)).map(item => {
                      const isActive = currentPageName === item.page;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.page}
                          to={`/${item.page}`}
                          onClick={() => setMobileOpen(false)}
                          className={`
                            flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 text-sm
                            ${isActive
                              ? "bg-blue-500/15 text-blue-400"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                            }
                          `}
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
                {configItems.filter(item => canAccess(item.page)).map(item => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.page}
                      to={`/${item.page}`}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-center px-2 py-2.5 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                      title={item.name}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Collapse toggle */}
        <div className="hidden lg:flex border-t border-white/10 p-3 justify-center">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              {[...navItems, ...configItems].find(i => i.page === currentPageName)?.name || currentPageName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate(createPageUrl("Notifications"))}
            >
              <Bell className="w-[18px] h-[18px] text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            {user && (
              <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">
                    {user.full_name?.[0] || user.email?.[0] || "U"}
                  </span>
                </div>
                <span className="text-sm text-slate-700 font-medium">{user.full_name || user.email}</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}