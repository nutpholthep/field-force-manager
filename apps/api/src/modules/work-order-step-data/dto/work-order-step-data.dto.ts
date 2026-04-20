import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateWorkOrderStepDataDto {
  @ApiProperty() @IsString() work_order_id!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() work_order_number?: string;
  @ApiProperty() @IsString() step_id!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() step_name?: string;
  @ApiProperty() @IsString() task_id!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() task_label?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() task_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() value_text?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() value_boolean?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() value_file_url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() value_file_name?: string;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() value_materials?: any[];
}

export class UpdateWorkOrderStepDataDto extends PartialType(CreateWorkOrderStepDataDto) {}
