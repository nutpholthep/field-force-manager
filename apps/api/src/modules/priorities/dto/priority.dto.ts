import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DurationUnit } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePriorityDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() duration_value?: number;
  @ApiPropertyOptional({ enum: DurationUnit })
  @IsOptional()
  @IsEnum(DurationUnit)
  duration_unit?: DurationUnit;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdatePriorityDto extends PartialType(CreatePriorityDto) {}
