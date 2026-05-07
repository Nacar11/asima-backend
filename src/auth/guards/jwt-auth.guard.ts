import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@/utils/decorators/public.decorator';

/**
 * Standard access-token gate. Pairs with `JwtStrategy`.
 *
 * Honors the `@Public()` decorator: if a route is marked public, this guard
 * short-circuits without requiring a token. That's how `/auth/login` and
 * `/health` stay open even when this guard is applied at the controller
 * level.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
