'use client';

import { entities } from '@/lib/entity-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';
import type { Notification } from '@ffm/shared';
import type { LucideIcon } from 'lucide-react';

const typeIcons: Record<Notification['type'], LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
};

const typeColors: Record<Notification['type'], string> = {
  info: 'text-blue-500 bg-blue-50',
  warning: 'text-amber-500 bg-amber-50',
  error: 'text-red-500 bg-red-50',
  success: 'text-emerald-500 bg-emerald-50',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => entities.Notification.list('-created_date', 100),
  });

  const unread = notifications.filter((n) => !n.is_read);

  const markAsRead = async (id: string) => {
    await entities.Notification.update(id, { is_read: true });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllRead = async () => {
    for (const n of unread) {
      await entities.Notification.update(n.id, { is_read: true });
    }
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{unread.length} unread</p>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center bg-white">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Info;
            const color = typeColors[n.type] || typeColors.info;
            return (
              <Card
                key={n.id}
                className={`p-4 bg-white border-slate-200/80 transition-all ${
                  !n.is_read ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                      {/* TODO: tighten type — Notification schema may not include `category` */}
                      {(n as unknown as { category?: string }).category && (
                        <Badge variant="outline" className="text-[9px] capitalize">
                          {(n as unknown as { category?: string }).category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {moment(n.created_date).fromNow()}
                    </p>
                  </div>
                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => markAsRead(n.id)}
                    >
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
