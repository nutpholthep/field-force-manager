import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zone_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zone_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateTeamDto extends PartialType(CreateTeamDto) {}
