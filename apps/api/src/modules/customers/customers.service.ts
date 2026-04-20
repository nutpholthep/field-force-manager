import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateCustomerDto } from './dto/customer.dto';
import { UpdateCustomerDto } from './dto/customer.dto';
import { parseSort } from '../../common/utils/query.util';


@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { sort?: string; limit?: number; offset?: number; where?: Record<string, unknown> } = {}): Promise<Customer[]> {
    const { sort, limit = 100, offset = 0, where } = opts;
    return this.prisma.customer.findMany({
      where,
      orderBy: parseSort(sort) ?? { created_date: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
      skip: offset,
    }) as unknown as Promise<Customer[]>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.customer.count({ where });
  }

  async findById(id: string): Promise<Customer> {
    const result = await this.prisma.customer.findUnique({ where: { id } as any });
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
    return this.prisma.customer.delete({ where: { id } as any }) as unknown as Customer;
  }
}
