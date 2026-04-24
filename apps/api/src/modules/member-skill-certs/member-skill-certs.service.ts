import { Injectable, NotFoundException } from '@nestjs/common';
import { MemberSkillCert } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateMemberSkillCertDto, UpdateMemberSkillCertDto } from './dto/member-skill-cert.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class MemberSkillCertsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDateInput(value?: string): Date | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return new Date(`${trimmed}T00:00:00.000Z`);
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private normalizeDtoDates<T extends { issued_date?: string; expiry_date?: string }>(data: T): Omit<T, 'issued_date' | 'expiry_date'> & { issued_date?: Date; expiry_date?: Date } {
    return {
      ...data,
      issued_date: this.normalizeDateInput(data.issued_date),
      expiry_date: this.normalizeDateInput(data.expiry_date),
    };
  }

  private async syncTechnicianSkills(technicianId: string): Promise<void> {
    const certs = await this.prisma.memberSkillCert.findMany({
      where: {
        technician_id: technicianId,
        status: { notIn: ['rejected', 'expired'] },
        is_active: true,
      },
      select: { skill_name: true },
    });
    const skills = Array.from(
      new Set(certs.map((c) => c.skill_name).filter((name): name is string => !!name)),
    );
    await this.prisma.technician.update({
      where: { id: technicianId } as any,
      data: { skills },
    });
  }

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<MemberSkillCert[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.memberSkillCert.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<MemberSkillCert[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.memberSkillCert.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<MemberSkillCert> {
    const result = await this.prisma.memberSkillCert.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`MemberSkillCerts ${id} not found`);
    return result as unknown as MemberSkillCert;
  }

  async create(data: CreateMemberSkillCertDto): Promise<MemberSkillCert> {
    const payload = this.normalizeDtoDates(data);
    const created = await this.prisma.memberSkillCert.create({ data: payload as any }) as unknown as MemberSkillCert;
    await this.syncTechnicianSkills(created.technician_id);
    return created;
  }

  async update(id: string, data: UpdateMemberSkillCertDto): Promise<MemberSkillCert> {
    const before = await this.prisma.memberSkillCert.findUnique({ where: { id } as any });
    if (!before) throw new NotFoundException(`MemberSkillCerts ${id} not found`);

    const payload = this.normalizeDtoDates(data);
    const updated = await this.prisma.memberSkillCert.update({
      where: { id } as any,
      data: payload as any,
    }) as unknown as MemberSkillCert;

    await this.syncTechnicianSkills(updated.technician_id);
    if (before.technician_id !== updated.technician_id) {
      await this.syncTechnicianSkills(before.technician_id);
    }
    return updated;
  }

  async remove(id: string): Promise<MemberSkillCert> {
    const deleted = await this.prisma.memberSkillCert.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as MemberSkillCert;
    await this.syncTechnicianSkills(deleted.technician_id);
    return deleted;
  }
}
