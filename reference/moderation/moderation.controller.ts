import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { ModerationService } from '@/moderation/moderation.service';
import { ModerationItem } from '@/moderation/domain/moderation-item';
import { ContentReport } from '@/moderation/domain/content-report';
import { CreateReportDto } from '@/moderation/dto/create-report.dto';
import { ReviewModerationDto } from '@/moderation/dto/review-moderation.dto';
import { QueryModerationQueueDto } from '@/moderation/dto/query-moderation-queue.dto';
import { BulkModerationDto } from '@/moderation/dto/bulk-moderation.dto';
import { QueryModerationHistoryDto } from '@/moderation/dto/query-moderation-history.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { SystemAdmin } from '@/users/users.decorator';
import { SystemAdminGuard } from '@/users/user.guard';

/**
 * Moderation Controller.
 *
 * Handles HTTP endpoints for content moderation functionality.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Moderation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'moderation',
  version: '1',
})
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('reports')
  @ApiOperation({
    summary: 'Report inappropriate content',
    description: 'Creates a content report for inappropriate content',
  })
  @ApiCreatedResponse({
    type: ContentReport,
    description: 'Content report created successfully',
  })
  async reportContent(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: User,
  ): Promise<ContentReport> {
    return this.moderationService.reportContent(dto, user);
  }

  @Get('admin/queue')
  @SystemAdmin(true)
  @UseGuards(SystemAdminGuard)
  @ApiOperation({
    summary: 'Get moderation queue',
    description:
      'Returns paginated list of pending moderation items (Admin only)',
  })
  @ApiOkResponse({
    description: 'Moderation queue retrieved successfully',
  })
  async getModerationQueue(
    @Query() dto: QueryModerationQueueDto,
  ): Promise<PaginatedResponseDto<ModerationItem>> {
    const result = await this.moderationService.getModerationQueue(dto);
    return paginate(result, {
      page: dto.page || 1,
      limit: dto.limit || 20,
    });
  }

  @Get('admin/history')
  @SystemAdmin(true)
  @UseGuards(SystemAdminGuard)
  @ApiOperation({
    summary: 'Get moderation history',
    description: 'Returns paginated list of all moderated items (Admin only)',
  })
  @ApiOkResponse({
    description: 'Moderation history retrieved successfully',
  })
  async getModerationHistory(
    @Query() dto: QueryModerationHistoryDto,
  ): Promise<PaginatedResponseDto<ModerationItem>> {
    const result = await this.moderationService.getModerationHistory(dto);
    return paginate(result, {
      page: dto.page || 1,
      limit: dto.limit || 20,
    });
  }

  @Get('admin/:id')
  @SystemAdmin(true)
  @UseGuards(SystemAdminGuard)
  @ApiOperation({
    summary: 'Get moderation item',
    description: 'Returns a moderation item by ID with actions (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Moderation item ID',
  })
  @ApiOkResponse({
    type: ModerationItem,
    description: 'Moderation item retrieved successfully',
  })
  async getModerationItem(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ModerationItem> {
    return this.moderationService.getModerationItem(id);
  }

  @Post('admin/:id/review')
  @SystemAdmin(true)
  @UseGuards(SystemAdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Review moderation item',
    description: 'Takes an action on a moderation item (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Moderation item ID',
  })
  @ApiOkResponse({
    type: ModerationItem,
    description: 'Moderation item reviewed successfully',
  })
  async reviewItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewModerationDto,
    @CurrentUser() user: User,
  ): Promise<ModerationItem> {
    return this.moderationService.reviewItem(id, dto, user);
  }

  @Post('admin/bulk')
  @SystemAdmin(true)
  @UseGuards(SystemAdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk moderation actions',
    description:
      'Applies the same action to multiple moderation items (Admin only)',
  })
  @ApiOkResponse({
    type: [ModerationItem],
    description: 'Bulk moderation actions completed successfully',
  })
  async bulkReview(
    @Body() dto: BulkModerationDto,
    @CurrentUser() user: User,
  ): Promise<ModerationItem[]> {
    return this.moderationService.bulkReview(dto, user);
  }

  @Get('admin/:id/actions')
  @SystemAdmin(true)
  @UseGuards(SystemAdminGuard)
  @ApiOperation({
    summary: 'Get moderation actions for an item',
    description: 'Returns all actions taken on a moderation item (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Moderation item ID',
  })
  @ApiOkResponse({
    type: Array,
    description: 'Moderation actions retrieved successfully',
  })
  async getModerationActions(@Param('id', ParseIntPipe) id: number) {
    return this.moderationService.getModerationActions(id);
  }
}
