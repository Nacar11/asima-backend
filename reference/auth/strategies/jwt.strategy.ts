import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadType } from './types/jwt-payload.type';
import { AllConfigType } from '@/config/config.type';
import { UsersService } from '@/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<AllConfigType>,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret', { infer: true }),
    });
  }

  public async validate(payload: JwtPayloadType) {
    if (!payload.id) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      ...user,
      sessionId: payload.sessionId,
      seller_id: payload.seller_id,
      is_store_owner: payload.is_store_owner,
    };
  }
}
