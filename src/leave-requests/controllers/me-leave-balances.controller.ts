import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaveBalanceService } from '@/leave-requests/leave-balance.service';
import { LeaveRequestAssembler } from '@/leave-requests/leave-request.assembler';
import { LeaveBalanceResponseDto } from '@/leave-requests/dto/response/leave-balance-response.dto';
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
  @ApiResponse({ status: 200, type: [LeaveBalanceResponseDto] })
  async forMe(@CurrentUser() me: User): Promise<LeaveBalanceResponseDto[]> {
    return LeaveRequestAssembler.toBalanceResponseList(await this.balances.forEmployee(me.id));
  }
}
