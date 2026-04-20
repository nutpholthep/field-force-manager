import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ActiveStatus, SiteType } from '@prisma/client';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSiteDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zone_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zone_name?: string;
  @ApiPropertyOptional({ enum: SiteType }) @IsOptional() @IsEnum(SiteType) site_type?: SiteType;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() equipment?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() access_instructions?: string;
  @ApiPropertyOptional({ enum: ActiveStatus }) @IsOptional() @IsEnum(ActiveStatus) status?: ActiveStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
}
export class UpdateSiteDto extends PartialType(CreateSiteDto) {}
