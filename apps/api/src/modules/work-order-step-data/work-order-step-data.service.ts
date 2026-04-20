import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkOrderStepData } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateWorkOrderStepDataDto, UpdateWorkOrderStepDataDto } from './dto/work-order-step-data.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class WorkOrderStepDataService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<WorkOrderStepData[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.workOrderStepData.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<WorkOrderStepData[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.workOrderStepData.count({ where });
  }

  async findById(id: string): Promise<WorkOrderStepData> {
    const result = await this.prisma.workOrderStepData.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`WorkOrderStepData ${id} not found`);
    return result as unknown as WorkOrderStepData;
  }

  async create(data: CreateWorkOrderStepDataDto): Promise<WorkOrderStepData> {
    return this.prisma.workOrderStepData.create({ data: data as any }) as unknown as WorkOrderStepData;
  }

  async update(id: string, data: UpdateWorkOrderStepDataDto): Promise<WorkOrderStepData> {
    return this.prisma.workOrderStepData.update({ where: { id } as any, data: data as any }) as unknown as WorkOrderStepData;
  }

  async remove(id: string): Promise<WorkOrderStepData> {
    return this.prisma.workOrderStepData.delete({ where: { id } as any }) as unknown as WorkOrderStepData;
  }
}
