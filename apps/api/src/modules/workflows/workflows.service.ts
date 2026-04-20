import { Injectable, NotFoundException } from '@nestjs/common';
import { Workflow } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<Workflow[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.workflow.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Workflow[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.workflow.count({ where });
  }

  async findById(id: string): Promise<Workflow> {
    const result = await this.prisma.workflow.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`Workflows ${id} not found`);
    return result as unknown as Workflow;
  }

  async create(data: CreateWorkflowDto): Promise<Workflow> {
    return this.prisma.workflow.create({ data: data as any }) as unknown as Workflow;
  }

  async update(id: string, data: UpdateWorkflowDto): Promise<Workflow> {
    return this.prisma.workflow.update({ where: { id } as any, data: data as any }) as unknown as Workflow;
  }

  async remove(id: string): Promise<Workflow> {
    return this.prisma.workflow.delete({ where: { id } as any }) as unknown as Workflow;
  }
}
