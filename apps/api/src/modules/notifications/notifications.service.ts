import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<Notification[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.notification.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Notification[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.notification.count({ where });
  }

  async findById(id: string): Promise<Notification> {
    const result = await this.prisma.notification.findUnique({ where: { id } as any });
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
    return this.prisma.notification.delete({ where: { id } as any }) as unknown as Notification;
  }
}
