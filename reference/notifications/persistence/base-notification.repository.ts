import { Notification } from '@/notifications/domain/notification';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for Notification operations.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseNotificationRepository {
  abstract create(notification: Notification): Promise<Notification>;

  abstract findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Notification>>;

  abstract findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Notification>>;

  abstract findById(id: number): Promise<Notification | null>;

  abstract findByUserId(
    userId: number,
    isRead?: boolean,
  ): Promise<Notification[]>;

  abstract getUnreadCount(userId: number): Promise<number>;

  abstract markAsRead(id: number, userId: number): Promise<void>;

  abstract markAllAsRead(userId: number): Promise<void>;

  abstract update(
    id: number,
    payload: Partial<Notification>,
  ): Promise<Notification>;

  abstract delete(id: number): Promise<void>;
}
