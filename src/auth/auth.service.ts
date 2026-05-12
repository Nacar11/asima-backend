import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { User } from '@/users/domain/user';
import { AllConfigType } from '@/config/config.type';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { AuthUserDto } from './dto/auth-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: BaseUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async login(email: string, password: string): Promise<LoginResponseDto> {
    const credentials = await this.userRepository.findByEmailWithCredentials(
      email.trim().toLowerCase(),
    );
    if (!credentials) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, credentials.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const { user } = credentials;
    if (!user.is_active || user.deleted_at) throw new UnauthorizedException('Account inactive');

    const tokens = await this.signTokens(user);
    await this.userRepository.recordLogin(user.id, new Date());

    return { ...tokens, user: AuthUserDto.from(user) };
  }

  /**
   * Issues a fresh access + refresh pair for the user already authenticated
   * by `JwtRefreshGuard`. Stateless v0: the prior refresh token remains
   * technically valid until natural expiry — see ADR roadmap for v1
   * sessions table.
   */
  async refresh(user: User): Promise<RefreshResponseDto> {
    return this.signTokens(user);
  }

  private async signTokens(user: User): Promise<RefreshResponseDto> {
    const payload = { id: user.id, system_admin: user.system_admin };
    const accessExpires = this.configService.getOrThrow('auth.expires', { infer: true });
    const refreshExpires = this.configService.getOrThrow('auth.refreshExpires', { infer: true });

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
        expiresIn: accessExpires,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('auth.refreshSecret', { infer: true }),
        expiresIn: refreshExpires,
      }),
    ]);

    return {
      access_token,
      refresh_token,
      token_expires_in: parseExpiresIn(accessExpires),
    };
  }
}

/**
 * Parses JWT-style expiresIn strings into seconds for the response body.
 * Supports `15m`, `7d`, `3600s`, `2h`, or a bare number (already seconds).
 */
function parseExpiresIn(value: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(value);
  if (!match) return 0;
  const n = parseInt(match[1], 10);
  switch (match[2]) {
    case 'd':
      return n * 86_400;
    case 'h':
      return n * 3600;
    case 'm':
      return n * 60;
    case 's':
    case undefined:
      return n;
    default:
      return 0;
  }
}
