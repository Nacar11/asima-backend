import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';

export interface FacebookProfile {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
  systemAdmin?: boolean; // For mock testing - determines if user is system admin
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService<AllConfigType>) {
    super({
      clientID: configService.get('facebook.appId', { infer: true }),
      clientSecret: configService.get('facebook.appSecret', { infer: true }),
      callbackURL: configService.get('facebook.callbackUrl', { infer: true }),
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): void {
    const { id, name, emails, photos } = profile;

    const user: FacebookProfile = {
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || '',
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
