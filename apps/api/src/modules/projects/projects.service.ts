import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<Project[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.project.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Project[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.project.count({ where });
  }

  async findById(id: string): Promise<Project> {
    const result = await this.prisma.project.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`Projects ${id} not found`);
    return result as unknown as Project;
  }

  async create(data: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({ data: data as any }) as unknown as Project;
  }

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    return this.prisma.project.update({ where: { id } as any, data: data as any }) as unknown as Project;
  }

  async remove(id: string): Promise<Project> {
    return this.prisma.project.delete({ where: { id } as any }) as unknown as Project;
  }
}
