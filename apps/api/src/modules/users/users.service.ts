import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { UpdateUserDto } from './dto/update-user.dto';
import { parseSort } from '../../common/utils/query.util';


type SanitizedUser = Omit<User, 'password_hash' | 'refresh_token'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<SanitizedUser[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.user.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<SanitizedUser[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async findById(id: string): Promise<SanitizedUser> {
    const result = await this.prisma.user.findUnique({ where: { id } as any });
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
    return this.prisma.user.delete({ where: { id } as any }) as unknown as SanitizedUser;
  }
}
