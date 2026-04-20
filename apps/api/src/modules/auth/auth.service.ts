import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: Omit<User, 'password_hash' | 'refresh_token'>; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const password_hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash,
        full_name: dto.full_name,
        phone: dto.phone,
        role: dto.role ?? 'viewer',
      },
    });
    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), tokens };
  }

  async login(dto: LoginDto): Promise<{ user: Omit<User, 'password_hash' | 'refresh_token'>; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.is_active) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });
    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret',
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.refresh_token !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
  }

  async me(userId: string): Promise<Omit<User, 'password_hash' | 'refresh_token'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwt.signAsync(payload);
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret';
    const refresh_token = await this.jwt.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refresh_token },
    });
    return {
      access_token,
      refresh_token,
      expires_in: 15 * 60,
    };
  }

  private sanitize(user: User): Omit<User, 'password_hash' | 'refresh_token'> {
    const { password_hash: _p, refresh_token: _r, ...rest } = user;
    void _p;
    void _r;
    return rest;
  }
}
