import { Injectable, NotFoundException } from '@nestjs/common';
import { Site } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateSiteDto, UpdateSiteDto } from './dto/site.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<Site[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.site.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Site[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.site.count({ where });
  }

  async findById(id: string): Promise<Site> {
    const result = await this.prisma.site.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`Sites ${id} not found`);
    return result as unknown as Site;
  }

  async create(data: CreateSiteDto): Promise<Site> {
    return this.prisma.site.create({ data: data as any }) as unknown as Site;
  }

  async update(id: string, data: UpdateSiteDto): Promise<Site> {
    return this.prisma.site.update({ where: { id } as any, data: data as any }) as unknown as Site;
  }

  async remove(id: string): Promise<Site> {
    return this.prisma.site.delete({ where: { id } as any }) as unknown as Site;
  }
}
