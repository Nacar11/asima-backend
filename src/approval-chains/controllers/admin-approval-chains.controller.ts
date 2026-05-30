import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApprovalChainsService } from '@/approval-chains/approval-chains.service';
import { SetChainDto } from '@/approval-chains/dto/admin/set-chain.dto';
import { BulkReassignDto } from '@/approval-chains/dto/admin/bulk-reassign.dto';
import { QueryApprovalChainDto } from '@/approval-chains/dto/admin/query-approval-chain.dto';
import { APPROVAL_STEP, ApprovalStep } from '@/approval-chains/approval-chains.constants';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Admin endpoints for managing per-employee approval chains.
 *
 * The "Approvers" surface. Gated by `APPROVAL_CHAIN:View` (reads) /
 * `APPROVAL_CHAIN:Update` (writes). Distinct from role/permission — see
 * ADR 0001 for why the chain is orthogonal to a user's role.
 */
@ApiTags('Admin - Approvers')
@ApiBearerAuth()
@Controller({ path: 'admin/approvers', version: API_VERSION })
export class AdminApprovalChainsController {
  constructor(private readonly service: ApprovalChainsService) {}

  @Get()
  @Permissions({ APPROVAL_CHAIN: 'View' })
  @ApiOperation({ summary: 'List employees with their current L1/L2 approver (paginated)' })
  @ApiResponse({ status: 200 })
  list(@Query() query: QueryApprovalChainDto) {
    return this.service.list(query);
  }

  @Post('bulk-reassign')
  @Permissions({ APPROVAL_CHAIN: 'Update' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reassign every active assignment from one approver to another',
    description: 'Skips employees who would become their own approver and returns the skipped ids.',
  })
  @ApiResponse({ status: 200 })
  bulkReassign(@Body() dto: BulkReassignDto, @CurrentUser() actor: User) {
    return this.service.bulkReassign(dto.from_approver_id, dto.to_approver_id, actor.id);
  }

  @Get(':employee_id')
  @Permissions({ APPROVAL_CHAIN: 'View' })
  @ApiOperation({ summary: "Get a single employee's active L1/L2 chain rows" })
  @ApiResponse({ status: 200 })
  getOne(@Param('employee_id', ParseIntPipe) employee_id: number) {
    return this.service.getActiveRows(employee_id);
  }

  @Patch(':employee_id')
  @Permissions({ APPROVAL_CHAIN: 'Update' })
  @ApiOperation({
    summary: "Set/clear an employee's L1 and/or L2 approver",
    description:
      'Omit a field to leave it unchanged; send null to clear it; send a users.id to set it. ' +
      'Ends superseded rows and inserts new ones atomically.',
  })
  @ApiResponse({ status: 200 })
  setChain(
    @Param('employee_id', ParseIntPipe) employee_id: number,
    @Body() dto: SetChainDto,
    @CurrentUser() actor: User,
  ) {
    return this.service.setChain(employee_id, dto, actor.id);
  }

  @Delete(':employee_id/:step')
  @Permissions({ APPROVAL_CHAIN: 'Update' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End one step of an employee chain without replacing it',
    description: 'step must be 1 (L1) or 2 (L2). Removing L1 while L2 is set is rejected (422).',
  })
  @ApiResponse({ status: 200 })
  endStep(
    @Param('employee_id', ParseIntPipe) employee_id: number,
    @Param('step', ParseIntPipe) step: number,
    @CurrentUser() actor: User,
  ) {
    if (step !== APPROVAL_STEP.L1 && step !== APPROVAL_STEP.L2) {
      throw new BadRequestException('step must be 1 (L1) or 2 (L2)');
    }
    return this.service.endStep(employee_id, step as ApprovalStep, actor.id);
  }
}
