import { Injectable, NotFoundException } from '@nestjs/common';
import { Site } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateSiteDto, UpdateSiteDto } from './dto/site.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<Site[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.site.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Site[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.site.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<Site> {
    const result = await this.prisma.site.findFirst({ where: withActiveWhere({ id }, false) as any });
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
    return this.prisma.site.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as Site;
  }
}
