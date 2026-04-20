import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { StuckReasonCategory } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateStuckReasonDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiPropertyOptional({ enum: StuckReasonCategory })
  @IsOptional()
  @IsEnum(StuckReasonCategory)
  category?: StuckReasonCategory;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateStuckReasonDto extends PartialType(CreateStuckReasonDto) {}
