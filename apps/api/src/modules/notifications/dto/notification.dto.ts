import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() message!: string;
  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_read?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() user_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() link?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() meta?: Record<string, any>;
}

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}
