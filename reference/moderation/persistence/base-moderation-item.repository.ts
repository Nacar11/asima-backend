import { ModerationItem } from '@/moderation/domain/moderation-item';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NullableType } from '@/utils/types/nullable.type';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ModerationStatusEnum } from '@/moderation/enums/moderation-status.enum';
import { ModerationPriorityEnum } from '@/moderation/enums/moderation-priority.enum';

/**
 * Abstract repository interface for ModerationItem operations.
 *
 * Defines the contract for moderation item data access operations.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseModerationItemRepository {
  /**
   * Create a new moderation item.
   *
   * @param item - ModerationItem domain model to create
   * @returns Promise<ModerationItem> - Created moderation item
   */
  abstract create(
    item: Omit<
      ModerationItem,
      'id' | 'created_at' | 'updated_at' | 'reporter' | 'reviewer'
    >,
  ): Promise<ModerationItem>;

  /**
   * Find a moderation item by ID.
   *
   * @param id - The moderation item ID
   * @returns Promise<ModerationItem | null> - Moderation item if found, null otherwise
   */
  abstract findById(id: number): Promise<NullableType<ModerationItem>>;

  /**
   * Find moderation items by content type and content ID.
   *
   * @param contentType - Content type
   * @param contentId - Content ID
   * @returns Promise<ModerationItem[]> - Array of moderation items
   */
  abstract findByContent(
    contentType: ContentTypeEnum,
    contentId: number,
  ): Promise<ModerationItem[]>;

  /**
   * Find all moderation items with filters and pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<ModerationItem>> - Paginated moderation items
   */
  abstract findAll(options: {
    filterQuery?: {
      status?: ModerationStatusEnum;
      contentType?: ContentTypeEnum;
      priority?: ModerationPriorityEnum;
      reportedReason?: string;
      reporterName?: string;
    };
    paginationOptions: IPaginationOptions;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<IPaginatedResult<ModerationItem>>;

  /**
   * Update a moderation item.
   *
   * @param id - Moderation item ID
   * @param payload - Partial moderation item data to update
   * @returns Promise<ModerationItem> - Updated moderation item
   */
  abstract update(
    id: number,
    payload: Partial<ModerationItem>,
  ): Promise<ModerationItem>;
}
