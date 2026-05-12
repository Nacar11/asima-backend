import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { UpdateMeDto } from '@/users/dto/me/update-me.dto';
import { ChangeMyPasswordDto } from '@/users/dto/me/change-my-password.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';

/**
 * Self-service endpoints. Audience: every authenticated user, including
 * admins acting on their own profile.
 *
 * Identity comes from `req.user.id`, NEVER from a path parameter — there
 * is intentionally no `:id` segment on any route here. That is the seam
 * that makes "what if an admin hits this?" a non-question: an admin
 * calling `PATCH /users/me` updates their own row with the same narrow
 * field set as any employee. To act on someone else, they must use
 * `/admin/users/:id` (which carries the `USER:*` permission gate).
 *
 * Authentication is enforced by the global `JwtAuthGuard`; no
 * `@Permissions(...)` here — identity is the gate.
 *
 * Companion: `admin-users.controller.ts` (`/admin/users`) for managing
 * ANY user — wide surface, permission-gated.
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users/me', version: API_VERSION })
export class MeUsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get my own profile (with role + permissions)' })
  @ApiResponse({ status: 200, type: User })
  me(@CurrentUser() actor: User): Promise<User> {
    return this.service.findById(actor.id);
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'Get my permission codes as a flat array',
    description:
      'Frontend should drive UI gating from this endpoint, not by parsing role.permissions.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: { permissions: { type: 'array', items: { type: 'string' } } },
    },
  })
  async permissions(@CurrentUser() actor: User): Promise<{ permissions: string[] }> {
    const me = await this.service.findById(actor.id);
    const codes = me.role?.permissions?.map((p) => p.code) ?? [];
    return { permissions: codes };
  }

  @Patch()
  @ApiOperation({
    summary: 'Update my own profile (narrow field set)',
    description:
      'Accepts first_name and last_name only. role_id, email, is_active, system_admin, ' +
      'and password are intentionally NOT writable here — see UpdateMeDto.',
  })
  @ApiResponse({ status: 200, type: User })
  update(@Body() dto: UpdateMeDto, @CurrentUser() actor: User): Promise<User> {
    return this.service.update(actor.id, { ...dto, updated_by: actor.id });
  }

  @Patch('password')
  @Throttle({ password: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change my own password',
    description:
      'Requires current_password — service re-verifies before hashing the new one. ' +
      'Distinct from POST /admin/users/:id/reset-password (admin override, no current pwd needed).',
  })
  @ApiResponse({ status: 204 })
  async changePassword(
    @Body() dto: ChangeMyPasswordDto,
    @CurrentUser() actor: User,
  ): Promise<void> {
    await this.service.changeMyPassword(actor.id, dto.current_password, dto.new_password);
  }
}
