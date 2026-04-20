import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() system_prompt?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() config?: Record<string, any>;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) assigned_zone_ids?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) assigned_zone_names?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateAgentDto extends PartialType(CreateAgentDto) {}
