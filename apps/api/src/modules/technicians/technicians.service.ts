import { Injectable, NotFoundException } from '@nestjs/common';
import { Technician } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateTechnicianDto, UpdateTechnicianDto } from './dto/technician.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class TechniciansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<Technician[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.technician.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Technician[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.technician.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<Technician> {
    const result = await this.prisma.technician.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`Technicians ${id} not found`);
    return result as unknown as Technician;
  }

  async create(data: CreateTechnicianDto): Promise<Technician> {
    return this.prisma.technician.create({ data: data as any }) as unknown as Technician;
  }

  async update(id: string, data: UpdateTechnicianDto): Promise<Technician> {
    return this.prisma.technician.update({ where: { id } as any, data: data as any }) as unknown as Technician;
  }

  async remove(id: string): Promise<Technician> {
    return this.prisma.technician.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as Technician;
  }
}
