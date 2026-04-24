import { Injectable, NotFoundException } from '@nestjs/common';
import { MaterialCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateMaterialCategoryDto, UpdateMaterialCategoryDto } from './dto/material-category.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class MaterialCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<MaterialCategory[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.materialCategory.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<MaterialCategory[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.materialCategory.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<MaterialCategory> {
    const result = await this.prisma.materialCategory.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`MaterialCategories ${id} not found`);
    return result as unknown as MaterialCategory;
  }

  async create(data: CreateMaterialCategoryDto): Promise<MaterialCategory> {
    return this.prisma.materialCategory.create({ data: data as any }) as unknown as MaterialCategory;
  }

  async update(id: string, data: UpdateMaterialCategoryDto): Promise<MaterialCategory> {
    return this.prisma.materialCategory.update({ where: { id } as any, data: data as any }) as unknown as MaterialCategory;
  }

  async remove(id: string): Promise<MaterialCategory> {
    return this.prisma.materialCategory.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as MaterialCategory;
  }
}
