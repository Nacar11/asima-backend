import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { AllConfigType } from '@/config/config.type';
import { JwtPayloadType } from './types/jwt-payload.type';

/**
 * Access-token strategy. Verifies signatures against `AUTH_JWT_SECRET`.
 *
 * On success, returns a fully-hydrated `User` with `role` + `role.permissions`
 * populated — `UsersService.findById` already loads these relations, so
 * downstream guards (PermissionsGuard) and `@CurrentUser()` get the rich
 * object without a second query.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<AllConfigType>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
    });
  }

  async validate(payload: JwtPayloadType): Promise<User> {
    if (!payload?.id) throw new UnauthorizedException();
    const user = await this.usersService.findById(payload.id).catch(() => null);
    if (!user || !user.is_active || user.deleted_at) throw new UnauthorizedException();
    return user;
  }
}
