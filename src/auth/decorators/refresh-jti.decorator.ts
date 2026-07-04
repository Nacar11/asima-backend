import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Resolves the `jti` of the refresh token presented on `POST /auth/refresh`.
 * `JwtRefreshStrategy` verifies the token is still active in the store and
 * stamps `req.refresh_jti`; this decorator hands it to the controller so the
 * service can rotate (revoke the old `jti`, issue a new one).
 */
export const RefreshJti = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().refresh_jti as string;
});
