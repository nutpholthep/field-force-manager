import type { UserRole } from '../enums';
import type { BaseEntity } from './base';

export interface User extends BaseEntity {
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
