import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MemberSkillCertStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateMemberSkillCertDto {
  @ApiProperty() @IsString() technician_id!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() technician_name?: string;
  @ApiProperty() @IsString() skill_id!: string;
  @ApiProperty() @IsString() skill_name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cert_file_url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cert_file_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() issued_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiry_date?: string;
  @ApiPropertyOptional({ enum: MemberSkillCertStatus })
  @IsOptional()
  @IsEnum(MemberSkillCertStatus)
  status?: MemberSkillCertStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() reviewer_note?: string;
}

export class UpdateMemberSkillCertDto extends PartialType(CreateMemberSkillCertDto) {}
