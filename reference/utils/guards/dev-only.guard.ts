import { Injectable, CanActivate, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';

/**
 * Guard that only allows access in development/test environments
 *
 * Use this guard to protect endpoints that should never be accessible in production,
 * such as mock authentication endpoints, test data generators, etc.
 *
 * @example
 * ```typescript
 * @Get('facebook/mock')
 * @UseGuards(DevOnlyGuard)
 * async facebookMockAuth() {
 *   // This endpoint is only accessible in development
 * }
 * ```
 */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(private configService: ConfigService<AllConfigType>) {}

  canActivate(): boolean {
    const nodeEnv = this.configService.get('app.nodeEnv', { infer: true });

    // Allow in development and test environments
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      return true;
    }

    // Block in production
    throw new ForbiddenException(
      'This endpoint is only available in development environments',
    );
  }
}
