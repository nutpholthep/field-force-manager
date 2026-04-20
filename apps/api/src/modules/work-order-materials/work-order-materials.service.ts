import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkOrderMaterial } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateWorkOrderMaterialDto, UpdateWorkOrderMaterialDto } from './dto/work-order-material.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class WorkOrderMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<WorkOrderMaterial[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.workOrderMaterial.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<WorkOrderMaterial[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.workOrderMaterial.count({ where });
  }

  async findById(id: string): Promise<WorkOrderMaterial> {
    const result = await this.prisma.workOrderMaterial.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`WorkOrderMaterials ${id} not found`);
    return result as unknown as WorkOrderMaterial;
  }

  async create(data: CreateWorkOrderMaterialDto): Promise<WorkOrderMaterial> {
    return this.prisma.workOrderMaterial.create({ data: data as any }) as unknown as WorkOrderMaterial;
  }

  async update(id: string, data: UpdateWorkOrderMaterialDto): Promise<WorkOrderMaterial> {
    return this.prisma.workOrderMaterial.update({ where: { id } as any, data: data as any }) as unknown as WorkOrderMaterial;
  }

  async remove(id: string): Promise<WorkOrderMaterial> {
    return this.prisma.workOrderMaterial.delete({ where: { id } as any }) as unknown as WorkOrderMaterial;
  }
}
