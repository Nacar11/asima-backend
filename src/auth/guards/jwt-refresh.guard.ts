import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Refresh-token gate. Pairs with `JwtRefreshStrategy`.
 *
 * Used only on `POST /auth/refresh`. Does NOT honor `@Public()` — refresh
 * always requires a refresh token.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
