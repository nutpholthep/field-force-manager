import { Injectable, NotFoundException } from '@nestjs/common';
import { Team } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<Team[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.team.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Team[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.team.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<Team> {
    const result = await this.prisma.team.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`Teams ${id} not found`);
    return result as unknown as Team;
  }

  async create(data: CreateTeamDto): Promise<Team> {
    return this.prisma.team.create({ data: data as any }) as unknown as Team;
  }

  async update(id: string, data: UpdateTeamDto): Promise<Team> {
    return this.prisma.team.update({ where: { id } as any, data: data as any }) as unknown as Team;
  }

  async remove(id: string): Promise<Team> {
    return this.prisma.team.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as Team;
  }
}
