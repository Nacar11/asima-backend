import { ContentReport } from '@/moderation/domain/content-report';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NullableType } from '@/utils/types/nullable.type';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ReportStatusEnum } from '@/moderation/enums/report-status.enum';

/**
 * Abstract repository interface for ContentReport operations.
 *
 * Defines the contract for content report data access operations.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseContentReportRepository {
  /**
   * Create a new content report.
   *
   * @param report - ContentReport domain model to create
   * @returns Promise<ContentReport> - Created content report
   */
  abstract create(
    report: Omit<ContentReport, 'id' | 'created_at' | 'reporter'>,
  ): Promise<ContentReport>;

  /**
   * Find a content report by ID.
   *
   * @param id - The content report ID
   * @returns Promise<ContentReport | null> - Content report if found, null otherwise
   */
  abstract findById(id: number): Promise<NullableType<ContentReport>>;

  /**
   * Find all content reports with filters and pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<ContentReport>> - Paginated content reports
   */
  abstract findAll(options: {
    filterQuery?: {
      status?: ReportStatusEnum;
      contentType?: ContentTypeEnum;
      contentId?: number;
    };
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<ContentReport>>;

  /**
   * Update a content report.
   *
   * @param id - Content report ID
   * @param payload - Partial content report data to update
   * @returns Promise<ContentReport> - Updated content report
   */
  abstract update(
    id: number,
    payload: Partial<ContentReport>,
  ): Promise<ContentReport>;
}
