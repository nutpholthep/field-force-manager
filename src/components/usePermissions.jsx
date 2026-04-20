import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { canAccessPage, canDoAction } from "./permissions";

let cachedUser = null;

export function useCurrentUser() {
  const [user, setUser] = useState(cachedUser);

  useEffect(() => {
    if (cachedUser) {
      setUser(cachedUser);
      return;
    }
    base44.auth.me().then(u => {
      cachedUser = u;
      setUser(u);
    }).catch(() => {});
  }, []);

  return user;
}

export function usePermissions() {
  const user = useCurrentUser();
  const role = user?.role || "user";

  return {
    user,
    role,
    canAccess: (page) => canAccessPage(role, page),
    canCreate: () => canDoAction(role, "create"),
    canEdit: () => canDoAction(role, "edit"),
    canDelete: () => canDoAction(role, "delete"),
    can: (action) => canDoAction(role, action),
  };
}