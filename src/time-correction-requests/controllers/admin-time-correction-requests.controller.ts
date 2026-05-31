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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TimeCorrectionRequestsService } from '@/time-correction-requests/time-correction-requests.service';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request';
import { FindAllTimeCorrectionRequest } from '@/time-correction-requests/domain/find-all-time-correction-request';
import { QueryTimeCorrectionRequestDto } from '@/time-correction-requests/dto/admin/query-time-correction-request.dto';
import { UpdateTimeCorrectionRequestDto } from '@/time-correction-requests/dto/admin/update-time-correction-request.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * HR / admin time-correction management across the org. Gated by
 * `TIME_CORRECTION:*` codes — a different family from `LEAVE:*`.
 */
@ApiTags('Admin - Time Correction Requests')
@ApiBearerAuth()
@Controller({ path: 'admin/time-correction-requests', version: API_VERSION })
export class AdminTimeCorrectionRequestsController {
  constructor(private readonly service: TimeCorrectionRequestsService) {}

  @Get()
  @Permissions({ TIME_CORRECTION: 'ViewAll' })
  @ApiOperation({ summary: 'List every correction request (paginated, filterable)' })
  @ApiResponse({ status: 200 })
  list(@Query() query: QueryTimeCorrectionRequestDto): Promise<FindAllTimeCorrectionRequest> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions({ TIME_CORRECTION: 'ViewAll' })
  @ApiOperation({ summary: 'Get any correction request by id' })
  getOne(@Param('id', ParseIntPipe) id: number): Promise<TimeCorrectionRequest> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Permissions({ TIME_CORRECTION: 'Update' })
  @ApiOperation({
    summary: 'Edit a still-pending correction request (HR only)',
    description: 'Only pending rows are editable; terminal rows are immutable (cancel + resubmit).',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTimeCorrectionRequestDto,
    @CurrentUser() actor: User,
  ): Promise<TimeCorrectionRequest> {
    return this.service.update(id, dto, actor);
  }

  @Delete(':id')
  @Permissions({ TIME_CORRECTION: 'Delete' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel any pending correction request (HR override)' })
  @ApiResponse({ status: 200, type: TimeCorrectionRequest })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: User,
  ): Promise<TimeCorrectionRequest> {
    return this.service.cancel(id, actor);
  }
}
