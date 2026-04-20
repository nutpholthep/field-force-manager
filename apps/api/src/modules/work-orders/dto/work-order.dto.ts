import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  SlaRisk,
  WorkOrderStatus,
} from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateWorkOrderDto {
  @ApiProperty() @IsString() order_number!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: WorkOrderStatus })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() stuck_reason_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stuck_reason_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stuck_note?: string;
  @ApiPropertyOptional({ description: 'Priority code (e.g. critical, high, medium, low)' })
  @IsOptional()
  @IsString()
  priority?: string;
  @ApiPropertyOptional({ description: 'Service type code (from ServiceType master or enum: installation, maintenance, repair, etc)' })
  @IsOptional()
  @IsString()
  service_type?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) required_skills?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() customer_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() site_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() site_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() site_latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() site_longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() zone_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_technician_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_technician_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() sla_due?: string;
  @ApiPropertyOptional({ enum: SlaRisk })
  @IsOptional()
  @IsEnum(SlaRisk)
  sla_risk?: SlaRisk;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduled_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() scheduled_time?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimated_duration_hrs?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() actual_duration_hrs?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() started_at?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() completed_at?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() travel_distance_km?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() labor_cost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() equipment_cost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() travel_cost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() total_cost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() customer_rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) attachments?: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() dispatch_score?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() project_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() project_step_id?: string;
}

export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {}
