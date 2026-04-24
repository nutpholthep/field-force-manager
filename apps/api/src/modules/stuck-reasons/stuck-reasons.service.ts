import { Injectable, NotFoundException } from '@nestjs/common';
import { StuckReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateStuckReasonDto, UpdateStuckReasonDto } from './dto/stuck-reason.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class StuckReasonsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<StuckReason[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.stuckReason.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<StuckReason[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.stuckReason.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<StuckReason> {
    const result = await this.prisma.stuckReason.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`StuckReasons ${id} not found`);
    return result as unknown as StuckReason;
  }

  async create(data: CreateStuckReasonDto): Promise<StuckReason> {
    return this.prisma.stuckReason.create({ data: data as any }) as unknown as StuckReason;
  }

  async update(id: string, data: UpdateStuckReasonDto): Promise<StuckReason> {
    return this.prisma.stuckReason.update({ where: { id } as any, data: data as any }) as unknown as StuckReason;
  }

  async remove(id: string): Promise<StuckReason> {
    return this.prisma.stuckReason.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as StuckReason;
  }
}
