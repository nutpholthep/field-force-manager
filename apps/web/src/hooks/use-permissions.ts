'use client';

import { useAuth } from '@/lib/auth-context';
import { canAccessPage, canDoAction, type Action } from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role ?? 'user';

  return {
    user,
    role,
    canAccess: (page: string) => canAccessPage(role, page),
    canCreate: () => canDoAction(role, 'create'),
    canEdit: () => canDoAction(role, 'edit'),
    canDelete: () => canDoAction(role, 'delete'),
    can: (action: Action | string) => canDoAction(role, action),
  };
}
