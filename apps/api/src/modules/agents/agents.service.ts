import { Injectable, NotFoundException } from '@nestjs/common';
import { AIAgent } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<AIAgent[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.aIAgent.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<AIAgent[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.aIAgent.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<AIAgent> {
    const result = await this.prisma.aIAgent.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`Agents ${id} not found`);
    return result as unknown as AIAgent;
  }

  async create(data: CreateAgentDto): Promise<AIAgent> {
    return this.prisma.aIAgent.create({ data: data as any }) as unknown as AIAgent;
  }

  async update(id: string, data: UpdateAgentDto): Promise<AIAgent> {
    return this.prisma.aIAgent.update({ where: { id } as any, data: data as any }) as unknown as AIAgent;
  }

  async remove(id: string): Promise<AIAgent> {
    return this.prisma.aIAgent.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as AIAgent;
  }
}
