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
import { LeaveRequestsService } from '@/leave-requests/leave-requests.service';
import { LeaveRequestAssembler } from '@/leave-requests/leave-request.assembler';
import { LeaveRequestResponseDto } from '@/leave-requests/dto/response/leave-request-response.dto';
import { LeaveRequestListItemResponseDto } from '@/leave-requests/dto/response/leave-request-list-item-response.dto';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';
import { QueryLeaveRequestDto } from '@/leave-requests/dto/admin/query-leave-request.dto';
import { UpdateLeaveRequestDto } from '@/leave-requests/dto/admin/update-leave-request.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * HR / admin leave management across the whole org. Gated by `LEAVE:*`
 * codes — distinct from the chain-placement check that governs who may
 * *approve* a specific request (that lives on the top-level approve route).
 */
@ApiTags('Admin - Leave Requests')
@ApiBearerAuth()
@Controller({ path: 'admin/leave-requests', version: API_VERSION })
export class AdminLeaveRequestsController {
  constructor(private readonly service: LeaveRequestsService) {}

  @Get()
  @Permissions({ LEAVE: 'ViewAll' })
  @ApiOperation({ summary: 'List every leave request (paginated, filterable)' })
  @ApiResponse({ status: 200 })
  async list(
    @Query() query: QueryLeaveRequestDto,
  ): Promise<PaginatedResponse<LeaveRequestListItemResponseDto>> {
    return LeaveRequestAssembler.toPaginatedResponse(await this.service.findAll(query));
  }

  @Get(':id')
  @Permissions({ LEAVE: 'ViewAll' })
  @ApiOperation({ summary: 'Get any leave request by id' })
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<LeaveRequestResponseDto> {
    return LeaveRequestAssembler.toResponse(await this.service.findById(id));
  }

  @Patch(':id')
  @Permissions({ LEAVE: 'Update' })
  @ApiOperation({
    summary: 'Edit a still-pending leave request (HR only)',
    description:
      'Only pending_l1 / pending_l2 rows are editable (Q3). Terminal rows are immutable — ' +
      'use cancel + resubmit. Does not change the approver snapshot.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeaveRequestDto,
    @CurrentUser() actor: User,
  ): Promise<LeaveRequestResponseDto> {
    return LeaveRequestAssembler.toResponse(await this.service.update(id, dto, actor));
  }

  @Delete(':id')
  @Permissions({ LEAVE: 'Delete' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel any pending leave request (HR override)',
    description: 'Maps to a status transition to cancelled — not a physical delete.',
  })
  @ApiResponse({ status: 200, type: LeaveRequestResponseDto })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: User,
  ): Promise<LeaveRequestResponseDto> {
    return LeaveRequestAssembler.toResponse(await this.service.cancel(id, actor));
  }
}
