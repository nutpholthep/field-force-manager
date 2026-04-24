import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email!: string;

  /** Web permission role; mapped to Prisma `UserRole` */
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'manager', 'dispatcher', 'viewer', 'user'])
  role?: string;
}
