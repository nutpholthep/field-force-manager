import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProjectStatus, WorkOrderPriority } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiPropertyOptional() @IsOptional() @IsString() project_number?: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() site_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() site_name?: string;
  @ApiProperty() @IsString() workflow_id!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() workflow_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() current_step_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() current_step_name?: string;
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
  @ApiPropertyOptional({ enum: WorkOrderPriority })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_technician_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_technician_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() start_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() target_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() completed_date?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) completed_steps?: string[];
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() step_history?: any[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
