import { Message } from '@/messages/domain/message';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NullableType } from '@/utils/types/nullable.type';

/**
 * Abstract repository interface for Message operations.
 *
 * Defines the contract for message data access operations.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseMessageRepository {
  /**
   * Create a new message.
   *
   * @param message - Message domain model to create
   * @returns Promise<Message> - Created message
   */
  abstract create(
    message: Omit<Message, 'id' | 'created_at'>,
  ): Promise<Message>;

  /**
   * Find a message by ID.
   *
   * @param id - The message ID
   * @returns Promise<Message | null> - Message if found, null otherwise
   */
  abstract findById(id: number): Promise<NullableType<Message>>;

  /**
   * Find messages by conversation ID.
   *
   * @param conversationId - Conversation ID
   * @param paginationOptions - Pagination options
   * @returns Promise<IPaginatedResult<Message>> - Paginated messages
   */
  abstract findByConversation(
    conversationId: number,
    paginationOptions: IPaginationOptions,
  ): Promise<IPaginatedResult<Message>>;

  /**
   * Mark specific messages as read.
   *
   * @param messageIds - Array of message IDs to mark as read
   * @param userId - User ID marking as read
   * @returns Promise<void>
   */
  abstract markAsRead(messageIds: number[], userId: number): Promise<void>;

  /**
   * Mark all unread messages in a conversation as read.
   *
   * @param conversationId - Conversation ID
   * @param userId - User ID marking as read
   * @returns Promise<void>
   */
  abstract markAllAsRead(conversationId: number, userId: number): Promise<void>;

  /**
   * Get unread message count for a conversation.
   *
   * @param conversationId - Conversation ID
   * @param userId - User ID to check unread count for
   * @returns Promise<number> - Unread message count
   */
  abstract findUnreadCount(
    conversationId: number,
    userId: number,
  ): Promise<number>;
}
