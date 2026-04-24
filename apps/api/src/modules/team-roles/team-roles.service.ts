import { Injectable, NotFoundException } from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateTeamRoleDto, UpdateTeamRoleDto } from './dto/team-role.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class TeamRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<TeamRole[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.teamRole.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<TeamRole[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.teamRole.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<TeamRole> {
    const result = await this.prisma.teamRole.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`TeamRoles ${id} not found`);
    return result as unknown as TeamRole;
  }

  async create(data: CreateTeamRoleDto): Promise<TeamRole> {
    return this.prisma.teamRole.create({ data: data as any }) as unknown as TeamRole;
  }

  async update(id: string, data: UpdateTeamRoleDto): Promise<TeamRole> {
    return this.prisma.teamRole.update({ where: { id } as any, data: data as any }) as unknown as TeamRole;
  }

  async remove(id: string): Promise<TeamRole> {
    return this.prisma.teamRole.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as TeamRole;
  }
}
