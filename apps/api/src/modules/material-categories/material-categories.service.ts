import { Injectable, NotFoundException } from '@nestjs/common';
import { MaterialCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateMaterialCategoryDto, UpdateMaterialCategoryDto } from './dto/material-category.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class MaterialCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<MaterialCategory[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.materialCategory.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<MaterialCategory[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.materialCategory.count({ where });
  }

  async findById(id: string): Promise<MaterialCategory> {
    const result = await this.prisma.materialCategory.findUnique({ where: { id } as any });
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
    return this.prisma.materialCategory.delete({ where: { id } as any }) as unknown as MaterialCategory;
  }
}
