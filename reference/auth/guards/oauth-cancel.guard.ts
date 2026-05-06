import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private configService: ConfigService<AllConfigType>) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      const res = context.switchToHttp().getResponse();
      const frontendUrl = this.configService.get('app.frontendDomain', {
        infer: true,
      });
      res.redirect(`${frontendUrl}/en/auth/callback?error=cancelled`);
      return false;
    }
  }
}

@Injectable()
export class FacebookOAuthGuard extends AuthGuard('facebook') {
  constructor(private configService: ConfigService<AllConfigType>) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      const res = context.switchToHttp().getResponse();
      const frontendUrl = this.configService.get('app.frontendDomain', {
        infer: true,
      });
      res.redirect(`${frontendUrl}/en/auth/callback?error=cancelled`);
      return false;
    }
  }
}
