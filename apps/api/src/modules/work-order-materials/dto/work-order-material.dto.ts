import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkOrderMaterialDto {
  @ApiProperty() @IsString() work_order_id!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() work_order_number?: string;
  @ApiProperty() @IsString() material_id!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() item_number?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() item_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() quantity_used?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() cost_price?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() total_cost?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateWorkOrderMaterialDto extends PartialType(CreateWorkOrderMaterialDto) {}
