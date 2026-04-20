import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateWorkflowDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() nodes?: any[];
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() edges?: any[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateWorkflowDto extends PartialType(CreateWorkflowDto) {}
