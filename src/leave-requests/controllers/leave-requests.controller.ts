import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaveRequestsService } from '@/leave-requests/leave-requests.service';
import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { RejectLeaveRequestDto } from '@/leave-requests/dto/reject-leave-request.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Approver-facing leave routes. These are neither admin nor self-service:
 * the caller is the *approver* acting on someone else's request (plan
 * §3.4 / Q5). `LEAVE:Approve` gates the route (role capability); the
 * service's `canActOn` enforces chain placement (or an override).
 */
@ApiTags('Leave Requests')
@ApiBearerAuth()
@Controller({ path: 'leave-requests', version: API_VERSION })
export class LeaveRequestsController {
  constructor(private readonly service: LeaveRequestsService) {}

  @Get(':id')
  @Permissions({ LEAVE: 'ViewOwn' })
  @ApiOperation({
    summary: 'Get a leave request (requester, either approver, or ViewAll)',
    description:
      'Route requires LEAVE:ViewOwn; the service additionally checks the caller is the ' +
      'requester, the snapshotted L1/L2 approver, or holds LEAVE:ViewAll / system_admin.',
  })
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() caller: User,
  ): Promise<LeaveRequest> {
    return this.service.findByIdForViewer(id, caller);
  }

  // approve / reject are intentionally NOT @Permissions-gated: the guard
  // can't express "LEAVE:Approve OR LEAVE:ApproveAny" (HR holds ApproveAny
  // but not Approve). The service's canActOn enforces both the role
  // capability and chain placement, returning 403 for everyone else.
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve the current step of a leave request' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() caller: User,
  ): Promise<LeaveRequest> {
    return this.service.approve(id, caller);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a leave request (note required)' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectLeaveRequestDto,
    @CurrentUser() caller: User,
  ): Promise<LeaveRequest> {
    return this.service.reject(id, caller, dto.note);
  }
}
