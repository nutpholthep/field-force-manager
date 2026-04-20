import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CustomerType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contact_person?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional({ enum: CustomerType })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
