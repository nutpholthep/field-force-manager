import { Injectable, NotFoundException } from '@nestjs/common';
import { Skill } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<Skill[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.skill.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Skill[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.skill.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<Skill> {
    const result = await this.prisma.skill.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`Skills ${id} not found`);
    return result as unknown as Skill;
  }

  async create(data: CreateSkillDto): Promise<Skill> {
    return this.prisma.skill.create({ data: data as any }) as unknown as Skill;
  }

  async update(id: string, data: UpdateSkillDto): Promise<Skill> {
    return this.prisma.skill.update({ where: { id } as any, data: data as any }) as unknown as Skill;
  }

  async remove(id: string): Promise<Skill> {
    return this.prisma.skill.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as Skill;
  }
}
