import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTechnicianAttendanceDto {
  @ApiProperty() @IsString() technician_id!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() technician_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() technician_code?: string;
  @ApiProperty() @IsDateString() date!: string;
  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() check_in_time?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() check_out_time?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() check_in_at?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() check_out_at?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() work_hours?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() scheduled_jobs?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateTechnicianAttendanceDto extends PartialType(CreateTechnicianAttendanceDto) {}
