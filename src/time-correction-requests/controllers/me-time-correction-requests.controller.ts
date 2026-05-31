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
import { TimeCorrectionRequestsService } from '@/time-correction-requests/time-correction-requests.service';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request';
import { FindAllTimeCorrectionRequest } from '@/time-correction-requests/domain/find-all-time-correction-request';
import { SubmitTimeCorrectionRequestDto } from '@/time-correction-requests/dto/me/submit-time-correction-request.dto';
import { QueryTimeCorrectionRequestDto } from '@/time-correction-requests/dto/admin/query-time-correction-request.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Self-service time-correction routes. Identity from the JWT — no `:id`
 * employee segment. The list is force-scoped to the caller.
 */
@ApiTags('Time Correction Requests')
@ApiBearerAuth()
@Controller({ path: 'users/me/time-correction-requests', version: API_VERSION })
export class MeTimeCorrectionRequestsController {
  constructor(private readonly service: TimeCorrectionRequestsService) {}

  @Get()
  @Permissions({ TIME_CORRECTION: 'ViewOwn' })
  @ApiOperation({ summary: 'List my time-correction requests (paginated)' })
  @ApiResponse({ status: 200 })
  list(
    @Query() query: QueryTimeCorrectionRequestDto,
    @CurrentUser() me: User,
  ): Promise<FindAllTimeCorrectionRequest> {
    return this.service.findAll({ ...query, employee_id: me.id });
  }

  @Post()
  @Permissions({ TIME_CORRECTION: 'Create' })
  @ApiOperation({ summary: 'Submit a time-correction request for myself' })
  @ApiResponse({ status: 201 })
  submit(
    @Body() dto: SubmitTimeCorrectionRequestDto,
    @CurrentUser() me: User,
  ): Promise<TimeCorrectionRequest> {
    return this.service.submit({ ...dto, employee_id: me.id }, me);
  }

  @Get(':id')
  @Permissions({ TIME_CORRECTION: 'ViewOwn' })
  @ApiOperation({ summary: 'Get one of my time-correction requests' })
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() me: User,
  ): Promise<TimeCorrectionRequest> {
    return this.service.findByIdForViewer(id, me);
  }

  @Post(':id/cancel')
  @Permissions({ TIME_CORRECTION: 'ViewOwn' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel one of my pending correction requests' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() me: User,
  ): Promise<TimeCorrectionRequest> {
    return this.service.cancel(id, me);
  }
}
