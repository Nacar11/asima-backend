import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { ConversationStatusEnum } from '@/messages/enums/conversation-status.enum';
import { ContextTypeEnum } from '@/messages/enums/context-type.enum';
import { Message } from '@/messages/domain/message';

/**
 * Conversation domain model.
 *
 * Represents a conversation between a seller and a customer.
 * Can be linked to a booking, sales order, or general inquiry.
 *
 * @version 1
 * @since 1.0.0
 */
export class Conversation {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Conversation ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID',
  })
  seller_id: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Seller details',
  })
  seller?: any;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Customer user ID',
  })
  customer_id: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'Customer user details',
  })
  customer?: Pick<User, 'id' | 'first_name' | 'last_name'>;

  @ApiPropertyOptional({
    enum: ContextTypeEnum,
    example: ContextTypeEnum.BOOKING,
    description: 'Context type (what the conversation is about)',
    nullable: true,
  })
  context_type?: ContextTypeEnum | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Context ID (booking_id, sales_order_id, etc.)',
    nullable: true,
  })
  context_id?: number | null;

  @ApiProperty({
    enum: ConversationStatusEnum,
    example: ConversationStatusEnum.ACTIVE,
    description: 'Conversation status',
  })
  status: ConversationStatusEnum;

  @ApiPropertyOptional({
    type: Date,
    example: '2025-12-20T10:30:00Z',
    description: 'Timestamp of the last message',
    nullable: true,
  })
  last_message_at?: Date | null;

  @ApiPropertyOptional({
    type: () => Message,
    description: 'Last message in the conversation',
    nullable: true,
  })
  last_message?: Message | null;

  @ApiPropertyOptional({
    type: Number,
    example: 3,
    description: 'Unread message count (computed)',
  })
  unread_count?: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created the conversation',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2025-12-20T10:00:00Z',
    description: 'When the conversation was created',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated the conversation',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2025-12-20T10:30:00Z',
    description: 'When the conversation was last updated',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who deleted the conversation',
    nullable: true,
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'When the conversation was deleted',
    nullable: true,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
