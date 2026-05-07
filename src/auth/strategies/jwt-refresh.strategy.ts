import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { AllConfigType } from '@/config/config.type';
import { JwtPayloadType } from './types/jwt-payload.type';

/**
 * Refresh-token strategy. Verifies signatures against `AUTH_REFRESH_SECRET`
 * — a different key from the access strategy. This is the seam that makes
 * sending an access token to `/auth/refresh` (or vice versa) fail signature
 * verification: the secrets don't match.
 *
 * Used only on `POST /auth/refresh` via `@UseGuards(JwtRefreshGuard)`.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService<AllConfigType>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.refreshSecret', { infer: true }),
    });
  }

  async validate(payload: JwtPayloadType): Promise<User> {
    if (!payload?.id) throw new UnauthorizedException();
    const user = await this.usersService.findById(payload.id).catch(() => null);
    if (!user || !user.is_active || user.deleted_at) throw new UnauthorizedException();
    return user;
  }
}
