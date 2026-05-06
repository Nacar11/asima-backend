import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';

export interface GoogleProfile {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
  systemAdmin?: boolean;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService<AllConfigType>) {
    super({
      clientID: configService.get('google.clientId', { infer: true }),
      clientSecret: configService.get('google.clientSecret', { infer: true }),
      callbackURL: configService.get('google.callbackUrl', { infer: true }),
      scope: ['email', 'profile'],
    });
  }

  authenticate(req: any, options?: any): void {
    super.authenticate(req, { ...options, prompt: 'select_account' });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, name, emails, photos } = profile;

    const user: GoogleProfile = {
      provider: 'google',
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
