import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MaterialItemType } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty() @IsString() item_number!: string;
  @ApiProperty() @IsString() item_name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() item_group?: string;
  @ApiPropertyOptional({ enum: MaterialItemType })
  @IsOptional()
  @IsEnum(MaterialItemType)
  item_type?: MaterialItemType;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warehouse?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() stock_qty?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() min_stock_qty?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() cost_price?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) keywords?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
