import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListQueryDto {
  @ApiPropertyOptional({ description: 'Sort string (e.g. "-created_date" or "name")' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Limit number of results' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @ApiPropertyOptional({ description: 'Offset for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'JSON string of where clause' })
  @IsOptional()
  @IsString()
  where?: string;

  @ApiPropertyOptional({ description: 'Include inactive records' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_inactive?: boolean = false;
}
