import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';

function mapInviteRole(role?: string): UserRole {
  switch (role) {
    case 'admin':
      return UserRole.admin;
    case 'manager':
      return UserRole.supervisor;
    case 'dispatcher':
      return UserRole.dispatcher;
    case 'viewer':
      return UserRole.viewer;
    case 'user':
    default:
      return UserRole.technician;
  }
}

type SanitizedUser = Omit<User, 'password_hash' | 'refresh_token'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<SanitizedUser[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.user.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<SanitizedUser[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.user.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<SanitizedUser> {
    const result = await this.prisma.user.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`Users ${id} not found`);
    return result as unknown as SanitizedUser;
  }

  async create(data: never): Promise<SanitizedUser> {
    return this.prisma.user.create({ data: data as any }) as unknown as SanitizedUser;
  }

  async update(id: string, data: UpdateUserDto): Promise<SanitizedUser> {
    return this.prisma.user.update({ where: { id } as any, data: data as any }) as unknown as SanitizedUser;
  }

  async remove(id: string): Promise<SanitizedUser> {
    return this.prisma.user.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as SanitizedUser;
  }

  async invite(inviter: AuthenticatedUser, dto: InviteUserDto): Promise<SanitizedUser> {
    if (inviter.role !== UserRole.admin && inviter.role !== UserRole.supervisor) {
      throw new ForbiddenException('Not allowed to invite users');
    }
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const tempPassword = `${randomBytes(16).toString('hex')}Aa1!`;
    const password_hash = await bcrypt.hash(tempPassword, 12);
    const local = dto.email.split('@')[0]?.trim() || 'User';
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash,
        full_name: local,
        role: mapInviteRole(dto.role),
      },
    });
    const { password_hash: _p, refresh_token: _r, ...rest } = user;
    void _p;
    void _r;
    return rest as SanitizedUser;
  }
}
