import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { BaseDisputeMessageRepository } from './persistence/base-dispute-message.repository';
import { BaseDisputeRepository } from './persistence/base-dispute.repository';
import {
  DisputeMessage,
  DisputeMessageSenderRole,
} from './domain/dispute-message';
import { CreateDisputeMessageDto } from './dto/create-dispute-message.dto';
import { User } from '@/users/domain/user';

/**
 * DisputeMessagesService.
 *
 * Handles threaded conversation messages within a dispute.
 * Customers, sellers, and admins can post messages to a dispute thread.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class DisputeMessagesService {
  constructor(
    private readonly messageRepository: BaseDisputeMessageRepository,
    private readonly disputeRepository: BaseDisputeRepository,
  ) {}

  /**
   * Post a message to a dispute thread.
   *
   * @param disputeId - Dispute ID
   * @param input - Message content and optional attachments
   * @param user - Authenticated user posting the message
   * @returns Created DisputeMessage
   */
  async createMessage(
    disputeId: number,
    input: CreateDisputeMessageDto,
    user: User,
  ): Promise<DisputeMessage> {
    const dispute = await this.disputeRepository.findById(disputeId);
    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    const senderRole = this.resolveSenderRole(dispute, user);
    if (input.sender_role && input.sender_role !== senderRole) {
      throw new BadRequestException(
        'sender_role does not match authenticated user role',
      );
    }

    const message = new DisputeMessage();
    message.dispute_id = disputeId;
    message.sender_id = user.id;
    message.sender_role = senderRole;
    message.message = input.message;
    message.attachment_urls = input.attachment_urls ?? null;

    return this.messageRepository.create(message);
  }

  /**
   * Get all messages for a dispute thread, ordered oldest-first.
   *
   * @param disputeId - Dispute ID
   * @returns Array of DisputeMessage
   */
  async getMessages(disputeId: number, user: User): Promise<DisputeMessage[]> {
    const dispute = await this.disputeRepository.findById(disputeId);
    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    this.resolveSenderRole(dispute, user);

    return this.messageRepository.findByDisputeId(disputeId);
  }

  private resolveSenderRole(
    dispute: { customer_id: number; seller?: { user_id?: number } | null },
    user: User,
  ): DisputeMessageSenderRole {
    const isAdmin = (user as any).system_admin === true;
    if (isAdmin) return 'admin';

    if (user.id === dispute.customer_id) return 'customer';

    if (dispute.seller?.user_id === user.id) return 'seller';

    throw new ForbiddenException('You are not a participant in this dispute');
  }
}
