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
import { TimeCorrectionRequestsService } from '@/time-correction-requests/time-correction-requests.service';
import { TimeCorrectionRequestAssembler } from '@/time-correction-requests/time-correction-request.assembler';
import { TimeCorrectionRequestResponseDto } from '@/time-correction-requests/dto/response/time-correction-request-response.dto';
import { RejectTimeCorrectionRequestDto } from '@/time-correction-requests/dto/reject-time-correction-request.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Approver-facing correction routes. approve/reject are JWT-only at the guard
 * because the PermissionsGuard can't express "Approve OR ApproveAny" (HR holds
 * ApproveAny but not Approve). The aggregate's `isActionableBy` (the lifted
 * `canActOn`) enforces role capability + chain placement — do NOT add a route
 * `@Permissions` here, it would 403 every HR `ApproveAny` holder.
 */
@ApiTags('Time Correction Requests')
@ApiBearerAuth()
@Controller({ path: 'time-correction-requests', version: API_VERSION })
export class TimeCorrectionRequestsController {
  constructor(private readonly service: TimeCorrectionRequestsService) {}

  // JWT-only at the route (like approve/reject below): findByIdForViewer is the
  // authorizer (requester / L1 / L2 / ViewAll / system_admin). A @Permissions
  // gate here would 403 a chain approver whose role lacks the employee-level
  // ViewOwn code before that check runs.
  @Get(':id')
  @ApiOperation({ summary: 'Get a correction request (requester, either approver, or ViewAll)' })
  @ApiResponse({ status: 200, type: TimeCorrectionRequestResponseDto })
  async getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() caller: User,
  ): Promise<TimeCorrectionRequestResponseDto> {
    const row = await this.service.findByIdForViewer(id, caller);
    return TimeCorrectionRequestAssembler.toResponse(row);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve the current step (applies the correction to the timesheet on final approval)',
  })
  @ApiResponse({ status: 200, type: TimeCorrectionRequestResponseDto })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() caller: User,
  ): Promise<TimeCorrectionRequestResponseDto> {
    const row = await this.service.approve(id, caller);
    return TimeCorrectionRequestAssembler.toResponse(row);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a correction request (note required)' })
  @ApiResponse({ status: 200, type: TimeCorrectionRequestResponseDto })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectTimeCorrectionRequestDto,
    @CurrentUser() caller: User,
  ): Promise<TimeCorrectionRequestResponseDto> {
    const row = await this.service.reject(id, caller, dto.note);
    return TimeCorrectionRequestAssembler.toResponse(row);
  }
}
