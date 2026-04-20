import { Injectable, NotFoundException } from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateTeamRoleDto, UpdateTeamRoleDto } from './dto/team-role.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class TeamRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<TeamRole[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.teamRole.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<TeamRole[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.teamRole.count({ where });
  }

  async findById(id: string): Promise<TeamRole> {
    const result = await this.prisma.teamRole.findUnique({ where: { id } as any });
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
    return this.prisma.teamRole.delete({ where: { id } as any }) as unknown as TeamRole;
  }
}
