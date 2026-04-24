import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<Notification[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.notification.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Notification[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.notification.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<Notification> {
    const result = await this.prisma.notification.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`Notifications ${id} not found`);
    return result as unknown as Notification;
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    return this.prisma.notification.create({ data: data as any }) as unknown as Notification;
  }

  async update(id: string, data: UpdateNotificationDto): Promise<Notification> {
    return this.prisma.notification.update({ where: { id } as any, data: data as any }) as unknown as Notification;
  }

  async remove(id: string): Promise<Notification> {
    return this.prisma.notification.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as Notification;
  }
}
