import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { AllConfigType } from '@/config/config.type';
import { BaseRefreshTokenRepository } from '@/auth/persistence/base-refresh-token.repository';
import { JwtPayloadType } from './types/jwt-payload.type';

/**
 * Refresh-token strategy. Verifies signatures against `AUTH_REFRESH_SECRET`
 * — a different key from the access strategy. This is the seam that makes
 * sending an access token to `/auth/refresh` (or vice versa) fail signature
 * verification: the secrets don't match.
 *
 * Beyond the signature it also checks the token's `jti` against the revocation
 * ledger (ADR 0002): a refresh token that has been rotated or revoked by logout
 * is still cryptographically valid and not yet time-expired, so ONLY this store
 * check rejects it. The verified `jti` is stamped on the request for the
 * controller/service to rotate.
 *
 * Used only on `POST /auth/refresh` via `@UseGuards(JwtRefreshGuard)`.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService<AllConfigType>,
    private readonly usersService: UsersService,
    private readonly refreshTokens: BaseRefreshTokenRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.refreshSecret', { infer: true }),
      passReqToCallback: true,
    });
  }

  async validate(req: Request & { refresh_jti?: string }, payload: JwtPayloadType): Promise<User> {
    // A refresh token issued before ADR 0002 (no jti) can't be in the ledger.
    if (!payload?.id || !payload.jti) throw new UnauthorizedException();

    if (!(await this.refreshTokens.isActive(payload.jti))) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const user = await this.usersService.findById(payload.id).catch(() => null);
    if (!user || !user.is_active || user.deleted_at) throw new UnauthorizedException();

    // Hand the verified jti to the controller so the service can rotate it.
    req.refresh_jti = payload.jti;
    return user;
  }
}
