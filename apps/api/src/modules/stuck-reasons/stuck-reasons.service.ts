import { Injectable, NotFoundException } from '@nestjs/common';
import { StuckReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateStuckReasonDto, UpdateStuckReasonDto } from './dto/stuck-reason.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class StuckReasonsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<StuckReason[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.stuckReason.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<StuckReason[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.stuckReason.count({ where });
  }

  async findById(id: string): Promise<StuckReason> {
    const result = await this.prisma.stuckReason.findUnique({ where: { id } as any });
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
    return this.prisma.stuckReason.delete({ where: { id } as any }) as unknown as StuckReason;
  }
}
