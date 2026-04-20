import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TechnicianAvailability, TechnicianStatus } from '@prisma/client';
import { IsArray, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTechnicianDto {
  @ApiProperty() @IsString() technician_code!: string;
  @ApiProperty() @IsString() full_name!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() photo_url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() linked_user_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() linked_user_email?: string;
  @ApiPropertyOptional({ enum: TechnicianStatus })
  @IsOptional()
  @IsEnum(TechnicianStatus)
  status?: TechnicianStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() team_role?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() team_role_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() team_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() team_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() home_latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() home_longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() current_latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() current_longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() zone_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zone_name?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) certifications?: string[];
  @ApiPropertyOptional() @IsOptional() @IsInt() max_daily_jobs?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() current_daily_jobs?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() avg_completion_time_hrs?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() sla_compliance_rate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() customer_rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() jobs_completed_total?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() performance_score?: number;
  @ApiPropertyOptional({ enum: TechnicianAvailability })
  @IsOptional()
  @IsEnum(TechnicianAvailability)
  availability?: TechnicianAvailability;
  @ApiPropertyOptional() @IsOptional() @IsString() working_hours_start?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() working_hours_end?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() hourly_rate?: number;
}

export class UpdateTechnicianDto extends PartialType(CreateTechnicianDto) {}
