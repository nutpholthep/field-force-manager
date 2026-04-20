import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkOrder } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<WorkOrder[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.workOrder.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<WorkOrder[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.workOrder.count({ where });
  }

  async findById(id: string): Promise<WorkOrder> {
    const result = await this.prisma.workOrder.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`WorkOrders ${id} not found`);
    return result as unknown as WorkOrder;
  }

  async create(data: CreateWorkOrderDto): Promise<WorkOrder> {
    const validServices = ['installation', 'maintenance', 'repair', 'inspection', 'emergency', 'upgrade', 'removal'];
    if (data.service_type && !validServices.includes(data.service_type)) data.service_type = 'maintenance';
    
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    if (data.priority && !validPriorities.includes(data.priority)) data.priority = 'medium';

    return this.prisma.workOrder.create({ data: data as any }) as unknown as WorkOrder;
  }

  async update(id: string, data: UpdateWorkOrderDto): Promise<WorkOrder> {
    return this.prisma.workOrder.update({ where: { id } as any, data: data as any }) as unknown as WorkOrder;
  }

  async remove(id: string): Promise<WorkOrder> {
    return this.prisma.workOrder.delete({ where: { id } as any }) as unknown as WorkOrder;
  }
}
