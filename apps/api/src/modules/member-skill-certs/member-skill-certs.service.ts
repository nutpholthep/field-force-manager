import { Injectable, NotFoundException } from '@nestjs/common';
import { MemberSkillCert } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateMemberSkillCertDto, UpdateMemberSkillCertDto } from './dto/member-skill-cert.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class MemberSkillCertsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<MemberSkillCert[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.memberSkillCert.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<MemberSkillCert[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.memberSkillCert.count({ where });
  }

  async findById(id: string): Promise<MemberSkillCert> {
    const result = await this.prisma.memberSkillCert.findUnique({ where: { id } as any });
    if (!result) throw new NotFoundException(`MemberSkillCerts ${id} not found`);
    return result as unknown as MemberSkillCert;
  }

  async create(data: CreateMemberSkillCertDto): Promise<MemberSkillCert> {
    return this.prisma.memberSkillCert.create({ data: data as any }) as unknown as MemberSkillCert;
  }

  async update(id: string, data: UpdateMemberSkillCertDto): Promise<MemberSkillCert> {
    return this.prisma.memberSkillCert.update({ where: { id } as any, data: data as any }) as unknown as MemberSkillCert;
  }

  async remove(id: string): Promise<MemberSkillCert> {
    return this.prisma.memberSkillCert.delete({ where: { id } as any }) as unknown as MemberSkillCert;
  }
}
