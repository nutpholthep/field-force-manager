import { Injectable, NotFoundException } from '@nestjs/common';
import { PriorityMaster } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreatePriorityDto, UpdatePriorityDto } from './dto/priority.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class PrioritiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<PriorityMaster[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.priorityMaster.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<PriorityMaster[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.priorityMaster.count({ where });
  }

  async findById(id: string): Promise<PriorityMaster> {
    const result = await this.prisma.priorityMaster.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`Priorities ${id} not found`);
    return result as unknown as PriorityMaster;
  }

  async create(data: CreatePriorityDto): Promise<PriorityMaster> {
    return this.prisma.priorityMaster.create({ data: data as any }) as unknown as PriorityMaster;
  }

  async update(id: string, data: UpdatePriorityDto): Promise<PriorityMaster> {
    return this.prisma.priorityMaster.update({ where: { id } as any, data: data as any }) as unknown as PriorityMaster;
  }

  async remove(id: string): Promise<PriorityMaster> {
    return this.prisma.priorityMaster.delete({ where: { id } as any }) as unknown as PriorityMaster;
  }
}
