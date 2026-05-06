import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseModerationItemRepository } from '@/moderation/persistence/base-moderation-item.repository';
import { BaseContentReportRepository } from '@/moderation/persistence/base-content-report.repository';
import { ModerationActionRepository } from '@/moderation/persistence/repositories/moderation-action.repository';
import { ModerationItem } from '@/moderation/domain/moderation-item';
import { ContentReport } from '@/moderation/domain/content-report';
import { ModerationAction } from '@/moderation/domain/moderation-action';
import { CreateReportDto } from '@/moderation/dto/create-report.dto';
import { ReviewModerationDto } from '@/moderation/dto/review-moderation.dto';
import { QueryModerationQueueDto } from '@/moderation/dto/query-moderation-queue.dto';
import { BulkModerationDto } from '@/moderation/dto/bulk-moderation.dto';
import { QueryModerationHistoryDto } from '@/moderation/dto/query-moderation-history.dto';
import { User } from '@/users/domain/user';
import { ModerationStatusEnum } from '@/moderation/enums/moderation-status.enum';
import { ModerationPriorityEnum } from '@/moderation/enums/moderation-priority.enum';
import { ReportStatusEnum } from '@/moderation/enums/report-status.enum';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';

/**
 * Moderation Service.
 *
 * Handles business logic for content moderation including reporting,
 * moderation queue management, reviewing items, and bulk actions.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class ModerationService {
  constructor(
    private readonly moderationItemRepository: BaseModerationItemRepository,
    private readonly contentReportRepository: BaseContentReportRepository,
    private readonly moderationActionRepository: ModerationActionRepository,
  ) {}

  /**
   * Report inappropriate content.
   *
   * Creates a content report and optionally creates a moderation item.
   *
   * @param dto - Create report DTO
   * @param user - Current authenticated user
   * @returns Created content report
   */
  async reportContent(
    dto: CreateReportDto,
    user: User,
  ): Promise<ContentReport> {
    // Create content report
    const report = new ContentReport();
    report.content_type = dto.content_type;
    report.content_id = dto.content_id;
    report.reported_by = user.id;
    report.reason = dto.reason;
    report.details = dto.details || null;
    report.status = ReportStatusEnum.PENDING;

    const createdReport = await this.contentReportRepository.create(report);

    // Create moderation item if it doesn't exist
    const existingItems = await this.moderationItemRepository.findByContent(
      dto.content_type,
      dto.content_id,
    );

    const pendingItem = existingItems.find(
      (item) => item.status === ModerationStatusEnum.PENDING,
    );

    if (!pendingItem) {
      const moderationItem = new ModerationItem();
      moderationItem.content_type = dto.content_type;
      moderationItem.content_id = dto.content_id;
      moderationItem.reported_by = user.id;
      moderationItem.reported_reason = dto.reason;
      moderationItem.status = ModerationStatusEnum.PENDING;
      moderationItem.priority = this.determinePriority(dto.reason);

      await this.moderationItemRepository.create(moderationItem);
    }

    return createdReport;
  }

  /**
   * Get moderation queue.
   *
   * Returns paginated list of pending moderation items.
   *
   * @param dto - Query moderation queue DTO
   * @returns Paginated moderation items
   */
  async getModerationQueue(
    dto: QueryModerationQueueDto,
  ): Promise<IPaginatedResult<ModerationItem>> {
    const paginationOptions: IPaginationOptions = {
      page: dto.page || 1,
      limit: dto.limit || 20,
    };

    const filterQuery: {
      status?: ModerationStatusEnum;
      contentType?: any;
      priority?: ModerationPriorityEnum;
      reportedReason?: string;
      reporterName?: string;
    } = {};

    // Only filter by status if explicitly provided
    if (dto.status) {
      filterQuery.status = dto.status;
    }

    if (dto.content_type) {
      filterQuery.contentType = dto.content_type;
    }

    if (dto.priority) {
      filterQuery.priority = dto.priority;
    }

    if (dto.reported_reason) {
      filterQuery.reportedReason = dto.reported_reason;
    }

    if (dto.reporter_name) {
      filterQuery.reporterName = dto.reporter_name;
    }

    return this.moderationItemRepository.findAll({
      filterQuery,
      paginationOptions,
      sortBy: dto.sort_by || 'priority',
      sortOrder: dto.sort_order || 'DESC',
    });
  }

  /**
   * Get moderation item by ID.
   *
   * @param id - Moderation item ID
   * @returns Moderation item with actions
   */
  async getModerationItem(id: number): Promise<ModerationItem> {
    const item = await this.moderationItemRepository.findById(id);

    if (!item) {
      throw new NotFoundException(`Moderation item with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Review a moderation item.
   *
   * Takes an action on a moderation item and records the action.
   *
   * @param id - Moderation item ID
   * @param dto - Review moderation DTO
   * @param user - Current authenticated admin user
   * @returns Updated moderation item
   */
  async reviewItem(
    id: number,
    dto: ReviewModerationDto,
    user: User,
  ): Promise<ModerationItem> {
    const item = await this.moderationItemRepository.findById(id);

    if (!item) {
      throw new NotFoundException(`Moderation item with ID ${id} not found`);
    }

    // Determine new status based on action
    let newStatus: ModerationStatusEnum;
    switch (dto.action) {
      case 'approve':
        newStatus = ModerationStatusEnum.APPROVED;
        break;
      case 'reject':
        newStatus = ModerationStatusEnum.REJECTED;
        break;
      case 'flag':
        newStatus = ModerationStatusEnum.FLAGGED;
        break;
      default:
        newStatus = item.status;
    }

    // Update moderation item
    const updatedItem = await this.moderationItemRepository.update(id, {
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date(),
      admin_notes: dto.admin_notes || null,
    });

    // Create moderation action record
    const action = new ModerationAction();
    action.moderation_item_id = id;
    action.action = dto.action;
    action.reason = dto.reason;
    action.admin_notes = dto.admin_notes || null;
    action.performed_by = user.id;

    await this.moderationActionRepository.create(action);

    // Update content report status if exists
    const reports = await this.contentReportRepository.findAll({
      filterQuery: {
        contentType: item.content_type,
        contentId: item.content_id,
      },
      paginationOptions: { page: 1, limit: 100 },
    });

    for (const report of reports.data) {
      if (report.status === ReportStatusEnum.PENDING) {
        await this.contentReportRepository.update(report.id, {
          status: ReportStatusEnum.REVIEWED,
        });
      }
    }

    return updatedItem;
  }

  /**
   * Perform bulk moderation actions.
   *
   * Applies the same action to multiple moderation items.
   *
   * @param dto - Bulk moderation DTO
   * @param user - Current authenticated admin user
   * @returns Array of updated moderation items
   */
  async bulkReview(
    dto: BulkModerationDto,
    user: User,
  ): Promise<ModerationItem[]> {
    const results: ModerationItem[] = [];

    for (const itemId of dto.moderation_item_ids) {
      try {
        const result = await this.reviewItem(
          itemId,
          {
            action: dto.action,
            reason: dto.reason,
            admin_notes: dto.admin_notes,
          },
          user,
        );
        results.push(result);
      } catch {
        // Skip items that fail (e.g., not found)
        continue;
      }
    }

    return results;
  }

  /**
   * Get moderation history.
   *
   * Returns paginated list of all moderated items (not pending).
   *
   * @param dto - Query moderation history DTO
   * @returns Paginated moderation items
   */
  async getModerationHistory(
    dto: QueryModerationHistoryDto,
  ): Promise<IPaginatedResult<ModerationItem>> {
    const paginationOptions: IPaginationOptions = {
      page: dto.page || 1,
      limit: dto.limit || 20,
    };

    const filterQuery: {
      status?: ModerationStatusEnum;
      contentType?: any;
    } = {};

    // Exclude pending items from history
    if (dto.status) {
      filterQuery.status = dto.status;
    }

    if (dto.content_type) {
      filterQuery.contentType = dto.content_type;
    }

    return this.moderationItemRepository.findAll({
      filterQuery,
      paginationOptions,
    });
  }

  /**
   * Get moderation actions for an item.
   *
   * @param moderationItemId - Moderation item ID
   * @returns Array of moderation actions
   */
  async getModerationActions(
    moderationItemId: number,
  ): Promise<ModerationAction[]> {
    return this.moderationActionRepository.findByModerationItemId(
      moderationItemId,
    );
  }

  /**
   * Determine priority based on report reason.
   *
   * @param reason - Report reason
   * @returns Priority level
   */
  private determinePriority(reason: string): ModerationPriorityEnum {
    const lowerReason = reason.toLowerCase();

    if (
      lowerReason.includes('urgent') ||
      lowerReason.includes('illegal') ||
      lowerReason.includes('violence')
    ) {
      return ModerationPriorityEnum.URGENT;
    }

    if (
      lowerReason.includes('spam') ||
      lowerReason.includes('scam') ||
      lowerReason.includes('fraud')
    ) {
      return ModerationPriorityEnum.HIGH;
    }

    if (
      lowerReason.includes('inappropriate') ||
      lowerReason.includes('offensive')
    ) {
      return ModerationPriorityEnum.MEDIUM;
    }

    return ModerationPriorityEnum.LOW;
  }
}
