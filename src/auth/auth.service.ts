import { randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { BaseRefreshTokenRepository } from '@/auth/persistence/base-refresh-token.repository';
import { User } from '@/users/domain/user';
import { AllConfigType } from '@/config/config.type';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { AuthUserDto } from './dto/auth-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: BaseUserRepository,
    private readonly refreshTokens: BaseRefreshTokenRepository,
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

    // Opportunistic prune (ADR 0002): sweep expired ledger rows on login so
    // the table stays bounded without a cron. Fire-and-forget — a failed
    // sweep must never block a login.
    void this.refreshTokens.deleteExpired(new Date()).catch(() => undefined);

    return { ...tokens, user: AuthUserDto.from(user) };
  }

  /**
   * Rotates the token pair for the user already authenticated by
   * `JwtRefreshGuard`. The presented refresh token's `jti` is atomically
   * revoked (ADR 0002); if it was already revoked/reused the store reports it
   * and we reject with 401. A fresh pair (new `jti`) is then issued.
   */
  async refresh(user: User, jti: string): Promise<RefreshResponseDto> {
    const rotated = await this.refreshTokens.revokeIfActive(jti);
    if (!rotated) {
      // Losing this atomic race means a second request presented the same jti
      // after the guard's ledger check — same reuse signal as the strategy
      // path, same response: kill the family (ADR 0002, amended).
      await this.refreshTokens.revokeAllForUser(user.id);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    // Revoke-then-issue is deliberately NOT transactional: if signing/issuing
    // fails here the presented token is already burned and the client must
    // re-login. That fails safe (no dangling active token) and self-heals.
    return this.signTokens(user);
  }

  /**
   * Logout = revoke ALL of the user's active refresh tokens (ADR 0002,
   * revoke-all / multi-device). The access token is stateless and lives out
   * its ≤15-min expiry.
   */
  async logout(userId: number): Promise<void> {
    await this.refreshTokens.revokeAllForUser(userId);
  }

  private async signTokens(user: User): Promise<RefreshResponseDto> {
    const basePayload = { id: user.id, system_admin: user.system_admin };
    const jti = randomUUID();
    const accessExpires = this.configService.getOrThrow('auth.expires', { infer: true });
    const refreshExpires = this.configService.getOrThrow('auth.refreshExpires', { infer: true });

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(basePayload, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
        expiresIn: accessExpires,
      }),
      this.jwtService.signAsync(
        { ...basePayload, jti },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', { infer: true }),
          expiresIn: refreshExpires,
        },
      ),
    ]);

    // Record the refresh token in the revocation ledger so it can be rotated
    // and revoked. Expiry mirrors the JWT's own `exp`.
    await this.refreshTokens.issue({
      user_id: user.id,
      jti,
      expires_at: new Date(Date.now() + parseExpiresIn(refreshExpires) * 1000),
    });

    return {
      access_token,
      refresh_token,
      token_expires_in: parseExpiresIn(accessExpires),
    };
  }
}

/**
 * Parses JWT-style expiresIn strings into seconds. Supports `15m`, `7d`,
 * `3600s`, `2h`, or a bare number (already seconds).
 *
 * Throws on anything else: since ADR 0002 this value also computes the
 * refresh ledger's `expires_at`, so a silently-wrong parse would mint rows
 * that are born expired and 401 every refresh. The env validator in
 * auth.config.ts rejects bad formats at boot; this throw is the backstop.
 */
function parseExpiresIn(value: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(value);
  if (!match) {
    throw new Error(
      `Unparseable expiresIn "${value}" — use digits with an optional s/m/h/d unit (e.g. "15m", "7d")`,
    );
  }
  const n = parseInt(match[1], 10);
  switch (match[2]) {
    case 'd':
      return n * 86_400;
    case 'h':
      return n * 3600;
    case 'm':
      return n * 60;
    default:
      return n;
  }
}
