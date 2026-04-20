import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateZoneDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
    description: 'Array of [longitude, latitude] coordinate pairs',
  })
  @IsOptional()
  @IsArray()
  polygon?: [number, number][];
  @ApiPropertyOptional() @IsOptional() @IsNumber() center_latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() center_longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() agent_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agent_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}
export class UpdateZoneDto extends PartialType(CreateZoneDto) {}
