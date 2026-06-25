import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaveAllocationsService } from '@/leave-allocations/leave-allocations.service';
import { LeaveAllocation } from '@/leave-allocations/domain/leave-allocation';
import { LeaveBalanceResponseDto } from '@/leave-requests/dto/response/leave-balance-response.dto';
import { LeaveRequestAssembler } from '@/leave-requests/leave-request.assembler';
import { GrantLeaveAllocationDto } from '@/leave-allocations/dto/admin/grant-leave-allocation.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Admin leave-allocation surface. Gated by `LEAVE_ALLOCATION:*`. The `:id`
 * path segment IS the target employee (this is the admin path; self-service
 * balances live at `/users/me/leave-balances` with no `:id`).
 */
@ApiTags('Admin - Leave Allocations')
@ApiBearerAuth()
@Controller({ path: 'admin/users/:id', version: API_VERSION })
export class AdminLeaveAllocationsController {
  constructor(private readonly service: LeaveAllocationsService) {}

  @Post('leave-allocations')
  @Permissions({ LEAVE_ALLOCATION: 'Create' })
  @ApiOperation({ summary: 'Grant leave days to an employee (append-only)' })
  @ApiResponse({ status: 201, type: LeaveAllocation })
  grant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GrantLeaveAllocationDto,
    @CurrentUser() actor: User,
  ): Promise<LeaveAllocation> {
    return this.service.grant(id, dto, actor);
  }

  @Get('leave-allocations')
  @Permissions({ LEAVE_ALLOCATION: 'View' })
  @ApiOperation({ summary: "An employee's grant history (newest first)" })
  @ApiResponse({ status: 200, type: [LeaveAllocation] })
  history(@Param('id', ParseIntPipe) id: number): Promise<LeaveAllocation[]> {
    return this.service.history(id);
  }

  @Get('leave-balances')
  @Permissions({ LEAVE_ALLOCATION: 'View' })
  @ApiOperation({ summary: "An employee's leave balances (available / used / reserved per type)" })
  @ApiResponse({ status: 200, type: [LeaveBalanceResponseDto] })
  async balances(@Param('id', ParseIntPipe) id: number): Promise<LeaveBalanceResponseDto[]> {
    return LeaveRequestAssembler.toBalanceResponseList(await this.service.balancesFor(id));
  }
}
