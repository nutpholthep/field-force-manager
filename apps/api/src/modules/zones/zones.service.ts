import { Injectable, NotFoundException } from '@nestjs/common';
import { Zone } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateZoneDto, UpdateZoneDto } from './dto/zone.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<Zone[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.zone.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Zone[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.zone.count({ where });
  }

  async findById(id: string): Promise<Zone> {
    const result = await this.prisma.zone.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`Zones ${id} not found`);
    return result as unknown as Zone;
  }

  async create(data: CreateZoneDto): Promise<Zone> {
    return this.prisma.zone.create({ data: data as any }) as unknown as Zone;
  }

  async update(id: string, data: UpdateZoneDto): Promise<Zone> {
    return this.prisma.zone.update({ where: { id } as any, data: data as any }) as unknown as Zone;
  }

  async remove(id: string): Promise<Zone> {
    return this.prisma.zone.delete({ where: { id } as any }) as unknown as Zone;
  }
}
