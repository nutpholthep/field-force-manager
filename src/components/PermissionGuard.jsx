import React from "react";
import { usePermissions } from "@/components/usePermissions";
import { ShieldOff } from "lucide-react";

export default function PermissionGuard({ page, children }) {
  const { canAccess, role } = usePermissions();

  if (!canAccess(page)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <ShieldOff className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-700">Access Restricted</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          Your role <span className="font-medium text-slate-600">({role})</span> does not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}