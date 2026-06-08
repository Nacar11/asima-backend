import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaveBalanceService } from '@/leave-requests/leave-balance.service';
import { LeaveBalance } from '@/leave-requests/domain/leave-balance';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Self-service leave balances. Identity from the JWT — no `:id` segment
 * (CLAUDE.md "Admin vs. self-service"). Returns one row per leave type,
 * including zero-grant types.
 */
@ApiTags('Leave Requests')
@ApiBearerAuth()
@Controller({ path: 'users/me/leave-balances', version: API_VERSION })
export class MeLeaveBalancesController {
  constructor(private readonly balances: LeaveBalanceService) {}

  @Get()
  @Permissions({ LEAVE: 'ViewOwn' })
  @ApiOperation({ summary: 'My leave balances (available / used / reserved per type)' })
  @ApiResponse({ status: 200, type: [LeaveBalance] })
  forMe(@CurrentUser() me: User): Promise<LeaveBalance[]> {
    return this.balances.forEmployee(me.id);
  }
}
