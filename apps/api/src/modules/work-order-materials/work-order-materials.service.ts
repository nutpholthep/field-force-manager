import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkOrderMaterial } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateWorkOrderMaterialDto, UpdateWorkOrderMaterialDto } from './dto/work-order-material.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class WorkOrderMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<WorkOrderMaterial[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.workOrderMaterial.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<WorkOrderMaterial[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.workOrderMaterial.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<WorkOrderMaterial> {
    const result = await this.prisma.workOrderMaterial.findFirst({ where: withActiveWhere({ id }, false) as any });
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
    return this.prisma.workOrderMaterial.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as WorkOrderMaterial;
  }
}
