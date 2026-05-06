import { Conversation } from '@/messages/domain/conversation';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NullableType } from '@/utils/types/nullable.type';
import { User } from '@/users/domain/user';

/**
 * Abstract repository interface for Conversation operations.
 *
 * Defines the contract for conversation data access operations.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseConversationRepository {
  /**
   * Create a new conversation.
   *
   * @param conversation - Conversation domain model to create
   * @returns Promise<Conversation> - Created conversation
   */
  abstract create(
    conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Conversation>;

  /**
   * Find a conversation by ID.
   *
   * @param id - The conversation ID
   * @returns Promise<Conversation | null> - Conversation if found, null otherwise
   */
  abstract findById(id: number): Promise<NullableType<Conversation>>;

  /**
   * Find conversation by participants and context.
   *
   * @param sellerId - Seller ID
   * @param customerId - Customer ID
   * @param contextType - Context type (optional)
   * @param contextId - Context ID (optional)
   * @returns Promise<Conversation | null> - Conversation if found, null otherwise
   */
  abstract findByParticipants(
    sellerId: number,
    customerId: number,
    contextType?: string | null,
    contextId?: number | null,
  ): Promise<NullableType<Conversation>>;

  /**
   * Find all conversations for a user (as seller or customer).
   *
   * @param userId - User ID
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<Conversation>> - Paginated conversations
   */
  abstract findAllForUser(
    userId: number,
    options: {
      filterQuery?: {
        status?: string;
      };
      paginationOptions: IPaginationOptions;
    },
  ): Promise<IPaginatedResult<Conversation>>;

  /**
   * Update a conversation.
   *
   * @param id - Conversation ID
   * @param payload - Partial conversation data to update
   * @returns Promise<Conversation> - Updated conversation
   */
  abstract update(
    id: number,
    payload: Partial<Conversation>,
  ): Promise<Conversation>;

  /**
   * Archive a conversation.
   *
   * @param id - Conversation ID
   * @param causer - User performing the action
   * @returns Promise<Conversation> - Updated conversation
   */
  abstract archive(id: number, causer: User): Promise<Conversation>;
}
