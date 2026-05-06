import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BaseConversationRepository } from '@/messages/persistence/base-conversation.repository';
import { BaseMessageRepository } from '@/messages/persistence/base-message.repository';
import { Conversation } from '@/messages/domain/conversation';
import { Message } from '@/messages/domain/message';
import { CreateConversationDto } from '@/messages/dto/create-conversation.dto';
import { SendMessageDto } from '@/messages/dto/send-message.dto';
import { QueryConversationsDto } from '@/messages/dto/query-conversations.dto';
import { QueryMessagesDto } from '@/messages/dto/query-messages.dto';
import { MarkAsReadDto } from '@/messages/dto/mark-as-read.dto';
import { User } from '@/users/domain/user';
import { SellersService } from '@/sellers/sellers.service';
import { UsersService } from '@/users/users.service';
import { ConversationStatusEnum } from '@/messages/enums/conversation-status.enum';
import { MessageTypeEnum } from '@/messages/enums/message-type.enum';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';

/**
 * Messages Service.
 *
 * Handles business logic for in-app messaging between customers and sellers.
 * Manages conversations, messages, read receipts, and conversation context.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class MessagesService {
  constructor(
    private readonly conversationRepository: BaseConversationRepository,
    private readonly messageRepository: BaseMessageRepository,
    private readonly sellersService: SellersService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Start a new conversation.
   *
   * Creates a conversation between a seller and customer.
   * If a conversation already exists for the same participants and context,
   * returns the existing conversation.
   *
   * @param dto - Create conversation DTO
   * @param user - Current authenticated user (must be seller or customer)
   * @returns Created or existing conversation
   */
  async startConversation(
    dto: CreateConversationDto,
    user: User,
  ): Promise<Conversation> {
    // Validate user is either seller or customer
    const seller = await this.sellersService.findById(dto.seller_id);
    await this.usersService.findById(dto.customer_id);

    // Check if user is authorized (must be seller owner or customer)
    const isSellerOwner = seller.user_id === user.id;
    const isCustomer = dto.customer_id === user.id;

    if (!isSellerOwner && !isCustomer) {
      throw new ForbiddenException(
        'You can only start conversations as the seller or customer',
      );
    }

    // Check if conversation already exists
    const existing = await this.conversationRepository.findByParticipants(
      dto.seller_id,
      dto.customer_id,
      dto.context_type || null,
      dto.context_id || null,
    );

    if (existing) {
      return existing;
    }

    // Create new conversation
    const conversation = new Conversation();
    conversation.seller_id = dto.seller_id;
    conversation.customer_id = dto.customer_id;
    conversation.context_type = dto.context_type || null;
    conversation.context_id = dto.context_id || null;
    conversation.status = ConversationStatusEnum.ACTIVE;
    conversation.created_by = user;
    conversation.updated_by = user;

    return this.conversationRepository.create(conversation);
  }

  /**
   * Send a message in a conversation.
   *
   * Creates a new message and updates conversation's last_message_at.
   *
   * @param dto - Send message DTO
   * @param user - Current authenticated user (sender)
   * @returns Created message
   */
  async sendMessage(dto: SendMessageDto, user: User): Promise<Message> {
    // Validate conversation exists and user is participant
    const conversation = await this.conversationRepository.findById(
      dto.conversation_id,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is participant
    const isSeller = conversation.seller_id === user.id;
    const isCustomer = conversation.customer_id === user.id;

    if (!isSeller && !isCustomer) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Check conversation status
    if (conversation.status === ConversationStatusEnum.BLOCKED) {
      throw new BadRequestException('This conversation is blocked');
    }

    // Validate message content based on type
    if (dto.message_type === MessageTypeEnum.TEXT && !dto.content) {
      throw new BadRequestException('Content is required for text messages');
    }

    if (
      (dto.message_type === MessageTypeEnum.IMAGE ||
        dto.message_type === MessageTypeEnum.FILE) &&
      (!dto.attachments || dto.attachments.length === 0)
    ) {
      throw new BadRequestException(
        'Attachments are required for image/file messages',
      );
    }

    // Create message
    const message = new Message();
    message.conversation_id = dto.conversation_id;
    message.sender_id = user.id;
    message.message_type = dto.message_type;
    message.content = dto.content || null;
    message.attachments = dto.attachments || null;

    const createdMessage = await this.messageRepository.create(message);

    // Update conversation's last_message_at
    await this.conversationRepository.update(dto.conversation_id, {
      last_message_at: new Date(),
      updated_by: user,
    } as Partial<Conversation>);

    // Send notification to recipient (MESSAGE_RECEIVED)
    try {
      // Determine recipient - if sender is seller, notify customer and vice versa
      const recipientId = isSeller
        ? conversation.customer_id
        : conversation.seller_id;

      if (recipientId) {
        const preview =
          dto.content && dto.content.length > 50
            ? dto.content.substring(0, 50) + '...'
            : dto.content || 'New message';

        await this.notificationsService.notify(
          recipientId,
          NotificationTypeEnum.MESSAGE_RECEIVED,
          'New Message',
          preview,
          'conversation',
          conversation.id,
          `/messages/${conversation.id}`,
        );
      }
    } catch (error) {
      console.error('Failed to send message notification:', error);
    }

    return createdMessage;
  }

  /**
   * Get conversations for the current user.
   *
   * Returns all conversations where the user is either seller or customer.
   *
   * @param dto - Query parameters
   * @param user - Current authenticated user
   * @returns Paginated conversations
   */
  async getConversations(
    dto: QueryConversationsDto,
    user: User,
  ): Promise<IPaginatedResult<Conversation>> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 50);

    const result = await this.conversationRepository.findAllForUser(user.id, {
      filterQuery: {
        status: dto.status,
      },
      paginationOptions: { page, limit },
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      result.data.map(async (conversation) => {
        const unreadCount = await this.messageRepository.findUnreadCount(
          conversation.id,
          user.id,
        );
        return {
          ...conversation,
          unread_count: unreadCount,
        };
      }),
    );

    return {
      data: conversationsWithUnread,
      totalResults: result.totalResults,
    };
  }

  /**
   * Get messages for a conversation.
   *
   * Returns paginated messages for a specific conversation.
   * User must be a participant.
   *
   * @param conversationId - Conversation ID
   * @param dto - Query parameters
   * @param user - Current authenticated user
   * @returns Paginated messages
   */
  async getMessages(
    conversationId: number,
    dto: QueryMessagesDto,
    user: User,
  ): Promise<IPaginatedResult<Message>> {
    // Validate conversation exists and user is participant
    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isSeller = conversation.seller_id === user.id;
    const isCustomer = conversation.customer_id === user.id;

    if (!isSeller && !isCustomer) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 50, 100);

    return this.messageRepository.findByConversation(conversationId, {
      page,
      limit,
    });
  }

  /**
   * Mark messages as read.
   *
   * Marks specific messages or all unread messages in a conversation as read.
   *
   * @param conversationId - Conversation ID
   * @param dto - Mark as read DTO
   * @param user - Current authenticated user
   * @returns void
   */
  async markAsRead(
    conversationId: number,
    dto: MarkAsReadDto,
    user: User,
  ): Promise<void> {
    // Validate conversation exists and user is participant
    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isSeller = conversation.seller_id === user.id;
    const isCustomer = conversation.customer_id === user.id;

    if (!isSeller && !isCustomer) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    if (dto.message_ids && dto.message_ids.length > 0) {
      // Mark specific messages as read
      await this.messageRepository.markAsRead(dto.message_ids, user.id);
    } else {
      // Mark all unread messages in conversation as read
      await this.messageRepository.markAllAsRead(conversationId, user.id);
    }
  }

  /**
   * Archive a conversation.
   *
   * Archives a conversation for the current user.
   *
   * @param conversationId - Conversation ID
   * @param user - Current authenticated user
   * @returns Updated conversation
   */
  async archiveConversation(
    conversationId: number,
    user: User,
  ): Promise<Conversation> {
    // Validate conversation exists and user is participant
    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isSeller = conversation.seller_id === user.id;
    const isCustomer = conversation.customer_id === user.id;

    if (!isSeller && !isCustomer) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    return this.conversationRepository.archive(conversationId, user);
  }

  /**
   * Get a conversation by ID.
   *
   * Returns a conversation if user is a participant.
   *
   * @param conversationId - Conversation ID
   * @param user - Current authenticated user
   * @returns Conversation
   */
  async getConversation(
    conversationId: number,
    user: User,
  ): Promise<Conversation> {
    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isSeller = conversation.seller_id === user.id;
    const isCustomer = conversation.customer_id === user.id;

    if (!isSeller && !isCustomer) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Add unread count
    const unreadCount = await this.messageRepository.findUnreadCount(
      conversationId,
      user.id,
    );

    return {
      ...conversation,
      unread_count: unreadCount,
    };
  }
}
