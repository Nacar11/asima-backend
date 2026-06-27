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
import { TimeCorrectionRequestAssembler } from '@/time-correction-requests/time-correction-request.assembler';
import { TimeCorrectionRequestResponseDto } from '@/time-correction-requests/dto/response/time-correction-request-response.dto';
import { TimeCorrectionRequestListItemResponseDto } from '@/time-correction-requests/dto/response/time-correction-request-list-item-response.dto';
import { QueryTimeCorrectionRequestDto } from '@/time-correction-requests/dto/admin/query-time-correction-request.dto';
import { UpdateTimeCorrectionRequestDto } from '@/time-correction-requests/dto/admin/update-time-correction-request.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';
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
  async list(
    @Query() query: QueryTimeCorrectionRequestDto,
  ): Promise<PaginatedResponse<TimeCorrectionRequestListItemResponseDto>> {
    const page = await this.service.findAll(query);
    return TimeCorrectionRequestAssembler.toPaginatedResponse(page);
  }

  @Get(':id')
  @Permissions({ TIME_CORRECTION: 'ViewAll' })
  @ApiOperation({ summary: 'Get any correction request by id' })
  @ApiResponse({ status: 200, type: TimeCorrectionRequestResponseDto })
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<TimeCorrectionRequestResponseDto> {
    const row = await this.service.findById(id);
    return TimeCorrectionRequestAssembler.toResponse(row);
  }

  @Patch(':id')
  @Permissions({ TIME_CORRECTION: 'Update' })
  @ApiOperation({
    summary: 'Edit a still-pending correction request (HR only)',
    description: 'Only pending rows are editable; terminal rows are immutable (cancel + resubmit).',
  })
  @ApiResponse({ status: 200, type: TimeCorrectionRequestResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTimeCorrectionRequestDto,
    @CurrentUser() actor: User,
  ): Promise<TimeCorrectionRequestResponseDto> {
    const row = await this.service.update(id, dto, actor);
    return TimeCorrectionRequestAssembler.toResponse(row);
  }

  @Delete(':id')
  @Permissions({ TIME_CORRECTION: 'Delete' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel any pending correction request (HR override)' })
  @ApiResponse({ status: 200, type: TimeCorrectionRequestResponseDto })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: User,
  ): Promise<TimeCorrectionRequestResponseDto> {
    const row = await this.service.cancel(id, actor);
    return TimeCorrectionRequestAssembler.toResponse(row);
  }
}
