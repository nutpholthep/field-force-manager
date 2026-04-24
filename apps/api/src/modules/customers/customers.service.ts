import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateCustomerDto } from './dto/customer.dto';
import { UpdateCustomerDto } from './dto/customer.dto';
import { parseSort, withActiveWhere } from '../../common/utils/query.util';


@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown>; includeInactive?: boolean } = {}): Promise<Customer[]> {
    const { sort, limit = 100, offset = 0, where, includeInactive = false } = opts;
    const effectiveWhere = withActiveWhere(where, includeInactive);
    return this.prisma.customer.findMany({
      where: effectiveWhere,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Customer[]>;
  }

  async count(where?: Record<string, unknown>, includeInactive = false): Promise<number> {
    return this.prisma.customer.count({ where: withActiveWhere(where, includeInactive) });
  }

  async findById(id: string): Promise<Customer> {
    const result = await this.prisma.customer.findFirst({ where: withActiveWhere({ id }, false) as any });
    if (!result) throw new NotFoundException(`Customers ${id} not found`);
    return result as unknown as Customer;
  }

  async create(data: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.create({ data: data as any }) as unknown as Customer;
  }

  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return this.prisma.customer.update({ where: { id } as any, data: data as any }) as unknown as Customer;
  }

  async remove(id: string): Promise<Customer> {
    return this.prisma.customer.update({ where: { id } as any, data: { is_active: false } as any }) as unknown as Customer;
  }
}
