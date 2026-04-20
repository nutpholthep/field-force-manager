import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateServiceTypeDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) required_skill_ids?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) allowed_priority_ids?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() default_priority_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() default_duration_hrs?: number;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() steps?: any[];
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() causes?: any[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateServiceTypeDto extends PartialType(CreateServiceTypeDto) {}
