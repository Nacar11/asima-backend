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
import { Compensation } from '@/compensation/domain/compensation';
import { FindAllCompensation } from '@/compensation/domain/find-all-compensation';
import { CreateCompensationDto } from '@/compensation/dto/admin/create-compensation.dto';
import { UpdateCompensationDto } from '@/compensation/dto/admin/update-compensation.dto';
import { QueryCompensationDto } from '@/compensation/dto/admin/query-compensation.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
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
  findAll(@Query() query: QueryCompensationDto): Promise<FindAllCompensation> {
    return this.service.findAll(query);
  }

  @Get('employees/:employeeId')
  @Permissions({ COMPENSATION: 'ViewAll' })
  @ApiOperation({
    summary: "An employee's compensation history (newest effective_from first)",
    description: 'The active row (effective_to = null), if any, is the current rate.',
  })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/Compensation' } },
  })
  history(@Param('employeeId', ParseIntPipe) employeeId: number): Promise<Compensation[]> {
    return this.service.findHistoryForEmployee(employeeId);
  }

  @Get(':id')
  @Permissions({ COMPENSATION: 'ViewAll' })
  @ApiOperation({ summary: 'Get a single compensation row by id' })
  @ApiResponse({ status: 200, type: Compensation })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Compensation> {
    return this.service.findById(id);
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
  @ApiResponse({ status: 201, type: Compensation })
  create(@Body() dto: CreateCompensationDto, @CurrentUser() actor: User): Promise<Compensation> {
    return this.service.create({ ...dto, created_by: actor.id });
  }

  @Patch(':id')
  @Permissions({ COMPENSATION: 'Update' })
  @ApiOperation({
    summary: 'Correct an erroneous compensation row in place',
    description:
      'No new history row — use POST to record a real pay change. A monthly_salary change ' +
      'recomputes the derived hourly rate; an explicit hourly_rate marks the row overridden.',
  })
  @ApiResponse({ status: 200, type: Compensation })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompensationDto,
    @CurrentUser() actor: User,
  ): Promise<Compensation> {
    return this.service.update(id, dto, actor.id);
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
