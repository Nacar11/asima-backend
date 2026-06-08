import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaveRequestsService } from '@/leave-requests/leave-requests.service';
import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { FindAllLeaveRequest } from '@/leave-requests/domain/find-all-leave-request';
import { SubmitLeaveRequestDto } from '@/leave-requests/dto/me/submit-leave-request.dto';
import { DayCountQueryDto } from '@/leave-requests/dto/me/day-count-query.dto';
import { QueryLeaveRequestDto } from '@/leave-requests/dto/admin/query-leave-request.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Self-service leave routes. Identity comes from the JWT — there is no
 * `:id` employee segment (CLAUDE.md "Admin vs. self-service"). The list
 * is force-scoped to the caller so `LEAVE:ViewOwn` can never leak another
 * employee's requests.
 */
@ApiTags('Leave Requests')
@ApiBearerAuth()
@Controller({ path: 'users/me/leave-requests', version: API_VERSION })
export class MeLeaveRequestsController {
  constructor(private readonly service: LeaveRequestsService) {}

  @Get()
  @Permissions({ LEAVE: 'ViewOwn' })
  @ApiOperation({ summary: 'List my leave requests (paginated)' })
  @ApiResponse({ status: 200 })
  list(
    @Query() query: QueryLeaveRequestDto,
    @CurrentUser() me: User,
  ): Promise<FindAllLeaveRequest> {
    return this.service.findAll({ ...query, employee_id: me.id });
  }

  @Post()
  @Permissions({ LEAVE: 'Create' })
  @ApiOperation({ summary: 'Submit a leave request for myself' })
  @ApiResponse({ status: 201 })
  submit(@Body() dto: SubmitLeaveRequestDto, @CurrentUser() me: User): Promise<LeaveRequest> {
    return this.service.submit({ ...dto, employee_id: me.id }, me);
  }

  @Get('day-count')
  @Permissions({ LEAVE: 'ViewOwn' })
  @ApiOperation({ summary: 'Preview working days for a date range (same D8 rules as submit)' })
  @ApiResponse({ status: 200 })
  dayCount(@Query() query: DayCountQueryDto, @CurrentUser() me: User) {
    return this.service.previewWorkingDays(
      me.id,
      query.start_date,
      query.end_date,
      query.day_portion,
      query.leave_type,
    );
  }

  @Get(':id')
  @Permissions({ LEAVE: 'ViewOwn' })
  @ApiOperation({ summary: 'Get one of my leave requests' })
  getOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() me: User): Promise<LeaveRequest> {
    return this.service.findByIdForViewer(id, me);
  }

  @Post(':id/cancel')
  @Permissions({ LEAVE: 'ViewOwn' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel one of my pending leave requests' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() me: User): Promise<LeaveRequest> {
    return this.service.cancel(id, me);
  }
}
