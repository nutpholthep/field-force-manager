import { Injectable, NotFoundException } from '@nestjs/common';
import { TechnicianAttendance } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateTechnicianAttendanceDto, UpdateTechnicianAttendanceDto } from './dto/technician-attendance.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class TechnicianAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<TechnicianAttendance[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.technicianAttendance.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<TechnicianAttendance[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.technicianAttendance.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<TechnicianAttendance> {
    const result = await this.prisma.technicianAttendance.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`TechnicianAttendance ${id} not found`);
    return result as unknown as TechnicianAttendance;
  }

  async create(data: CreateTechnicianAttendanceDto): Promise<TechnicianAttendance> {
    return this.prisma.technicianAttendance.create({ data: data as any }) as unknown as TechnicianAttendance;
  }

  async update(id: string, data: UpdateTechnicianAttendanceDto): Promise<TechnicianAttendance> {
    return this.prisma.technicianAttendance.update({ where: { id } as any, data: data as any }) as unknown as TechnicianAttendance;
  }

  async remove(id: string): Promise<TechnicianAttendance> {
    return this.prisma.technicianAttendance.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as TechnicianAttendance;
  }
}
