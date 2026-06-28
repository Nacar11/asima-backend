import {
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
import { CompensationService } from '@/compensation/compensation.service';
import { CompensationAssembler } from '@/compensation/compensation.assembler';
import { CompensationAuditAssembler } from '@/compensation/compensation-audit.assembler';
import { CompensationResponseDto } from '@/compensation/dto/response/compensation-response.dto';
import { CompensationAuditResponseDto } from '@/compensation/dto/response/compensation-audit-response.dto';
import { CreateCompensationDto } from '@/compensation/dto/admin/create-compensation.dto';
import { BulkCreateCompensationDto } from '@/compensation/dto/admin/bulk-create-compensation.dto';
import { UpdateCompensationDto } from '@/compensation/dto/admin/update-compensation.dto';
import { QueryCompensationDto } from '@/compensation/dto/admin/query-compensation.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';
import { User } from '@/users/domain/user';

/**
 * Admin endpoints for managing ANY employee's compensation. Gated by the
 * dedicated `COMPENSATION:*` resource — HR-only, separate from `USER:*` so
 * ordinary admins never see pay.
 *
 * Keeps the global `default` throttle — pay routes are not a hot typeahead
 * path, so they are NOT `@SkipThrottle()`d.
 */
@ApiTags('Admin - Compensation')
@ApiBearerAuth()
@Controller({ path: 'admin/compensation', version: API_VERSION })
export class AdminCompensationController {
  constructor(private readonly service: CompensationService) {}

  @Get()
  @Permissions({ COMPENSATION: 'ViewAll' })
  @ApiOperation({
    summary: 'List compensation (paginated; activeOnly by default, filterable by employee)',
  })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() query: QueryCompensationDto,
  ): Promise<PaginatedResponse<CompensationResponseDto>> {
    return CompensationAssembler.toPaginatedResponse(await this.service.findAll(query));
  }

  @Get('employees/:employeeId')
  @Permissions({ COMPENSATION: 'ViewAll' })
  @ApiOperation({
    summary: "An employee's compensation history (newest effective_from first)",
    description: 'The active row (effective_to = null), if any, is the current rate.',
  })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/CompensationResponseDto' } },
  })
  async history(
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ): Promise<CompensationResponseDto[]> {
    const rows = await this.service.findHistoryForEmployee(employeeId);
    return rows.map((r) => CompensationAssembler.toResponse(r));
  }

  @Get(':id')
  @Permissions({ COMPENSATION: 'ViewAll' })
  @ApiOperation({ summary: 'Get a single compensation row by id' })
  @ApiResponse({ status: 200, type: CompensationResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CompensationResponseDto> {
    return CompensationAssembler.toResponse(await this.service.findById(id));
  }

  @Get(':id/audit')
  @Permissions({ COMPENSATION: 'ViewAll' })
  @ApiOperation({
    summary: "A compensation row's audit trail (before→after each write, newest first)",
  })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/CompensationAuditResponseDto' } },
  })
  async auditTrail(@Param('id', ParseIntPipe) id: number): Promise<CompensationAuditResponseDto[]> {
    const rows = await this.service.findAuditTrail(id);
    return rows.map((r) => CompensationAuditAssembler.toResponse(r));
  }

  @Post()
  @Permissions({ COMPENSATION: 'Create' })
  @ApiOperation({
    summary: "Set / change an employee's compensation",
    description:
      'Effective-dated and one-step: the prior active row is auto-end-dated and the new row ' +
      'inserted in one transaction. effective_from cannot be in the future and must be after ' +
      "the current rate's effective_from. Omit hourly_rate to derive it from monthly_salary.",
  })
  @ApiResponse({ status: 201, type: CompensationResponseDto })
  async create(
    @Body() dto: CreateCompensationDto,
    @CurrentUser() actor: User,
  ): Promise<CompensationResponseDto> {
    return CompensationAssembler.toResponse(
      await this.service.create({ ...dto, created_by: actor.id }),
    );
  }

  @Post('bulk')
  @Permissions({ COMPENSATION: 'Create' })
  @ApiOperation({
    summary: 'Set pay for multiple employees (all-or-nothing)',
    description:
      'One transaction for the whole batch — any item failing rolls back all. Duplicate ' +
      'employee_id in the payload is rejected (422); each item follows the same rules as the ' +
      'single set-pay route.',
  })
  @ApiResponse({
    status: 201,
    schema: { type: 'array', items: { $ref: '#/components/schemas/CompensationResponseDto' } },
  })
  async createBulk(
    @Body() dto: BulkCreateCompensationDto,
    @CurrentUser() actor: User,
  ): Promise<CompensationResponseDto[]> {
    const rows = await this.service.createBulk(dto.items, actor.id);
    return rows.map((r) => CompensationAssembler.toResponse(r));
  }

  @Patch(':id')
  @Permissions({ COMPENSATION: 'Update' })
  @ApiOperation({
    summary: 'Correct an erroneous compensation row in place',
    description:
      'No new history row — use POST to record a real pay change. A monthly_salary change ' +
      'always re-derives the hourly rate and clears any override; an explicit hourly_rate ' +
      'marks the row overridden.',
  })
  @ApiResponse({ status: 200, type: CompensationResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompensationDto,
    @CurrentUser() actor: User,
  ): Promise<CompensationResponseDto> {
    return CompensationAssembler.toResponse(await this.service.update(id, dto, actor.id));
  }

  @Delete(':id')
  @Permissions({ COMPENSATION: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete an erroneous compensation row (active row only)',
    description:
      'Only the active row is deletable; deleting it reactivates the prior row so the employee ' +
      'is not left with a gap. Deleting a historical row is rejected (it would break findRateOnDate).',
  })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: User): Promise<void> {
    await this.service.softDelete(id, actor.id);
  }
}
