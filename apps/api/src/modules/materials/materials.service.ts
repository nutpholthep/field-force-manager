import { Injectable, NotFoundException } from '@nestjs/common';
import { Material } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<Material[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.material.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Material[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.material.count({ where });
  }

  async findById(id: string): Promise<Material> {
    const result = await this.prisma.material.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`Materials ${id} not found`);
    return result as unknown as Material;
  }

  async create(data: CreateMaterialDto): Promise<Material> {
    return this.prisma.material.create({ data: data as any }) as unknown as Material;
  }

  async update(id: string, data: UpdateMaterialDto): Promise<Material> {
    return this.prisma.material.update({ where: { id } as any, data: data as any }) as unknown as Material;
  }

  async remove(id: string): Promise<Material> {
    return this.prisma.material.delete({ where: { id } as any }) as unknown as Material;
  }
}
