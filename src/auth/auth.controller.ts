import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { AuthUserDto } from './dto/auth-user.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from '@/utils/decorators/public.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { API_VERSION } from '@/utils/constants/api.constants';

@ApiTags('Auth')
@Controller({ path: 'auth', version: API_VERSION })
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ login: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate with email + password',
    description:
      'Returns a short-lived access token and a long-lived refresh token. ' +
      'There is intentionally no /auth/register — admins create users via POST /admin/users.',
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account' })
  @ApiResponse({ status: 429, description: 'Too many login attempts (10/min/IP)' })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.service.login(dto.email, dto.password);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Return the authenticated user (identity + role, no permissions)',
    description:
      'Returns the user with a slim role (id + name). Permission codes for UI gating ' +
      'live at GET /users/me/permissions — never parse role.permissions client-side.',
  })
  @ApiResponse({ status: 200, type: AuthUserDto })
  me(@CurrentUser() actor: User): AuthUserDto {
    return AuthUserDto.from(actor);
  }

  /**
   * `@Public()` here makes the global `JwtAuthGuard` skip this route — the
   * REFRESH token is verified instead by `JwtRefreshGuard` (different
   * secret). Without `@Public()`, the global access-JWT guard would run
   * first and reject the refresh token (signed with the refresh secret).
   */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @Post('refresh')
  @Throttle({ refresh: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the access + refresh token pair',
    description:
      'Send the REFRESH token (not the access token) as Bearer. Returns a new pair — ' +
      'replace BOTH stored tokens with the response. Stateless v0: the old refresh token ' +
      'remains technically valid until natural expiry; v1 sessions table will revoke it.',
  })
  @ApiResponse({ status: 200, type: RefreshResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid, expired, or signed with the wrong secret',
  })
  refresh(@CurrentUser() actor: User): Promise<RefreshResponseDto> {
    return this.service.refresh(actor);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Stateless logout — frontend MUST discard tokens locally',
    description:
      'Returns 204. v0 cannot revoke tokens server-side (no sessions table); the access ' +
      'token remains valid until its 15-min expiry. v1 will add real revocation.',
  })
  @ApiResponse({ status: 204 })
  logout(): void {
    // Stateless — nothing to do server-side. Documented behavior.
  }
}
