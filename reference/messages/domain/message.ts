import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { MessageTypeEnum } from '@/messages/enums/message-type.enum';
import { MessageAttachment } from '@/messages/domain/message-attachment';

/**
 * Message domain model.
 *
 * Represents a single message in a conversation.
 *
 * @version 1
 * @since 1.0.0
 */
export class Message {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Message ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Conversation ID',
  })
  conversation_id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Sender user ID',
  })
  sender_id: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'Sender user details',
  })
  sender?: Pick<User, 'id' | 'first_name' | 'last_name'>;

  @ApiProperty({
    enum: MessageTypeEnum,
    example: MessageTypeEnum.TEXT,
    description: 'Message type',
  })
  message_type: MessageTypeEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Hello, I have a question about the service.',
    description: 'Message content (text)',
    nullable: true,
  })
  content?: string | null;

  @ApiPropertyOptional({
    type: Array,
    example: [
      {
        file_url: 'https://example.com/files/image.jpg',
        file_name: 'image.jpg',
        mime_type: 'image/jpeg',
        file_size: 1024000,
      },
    ],
    description: 'Message attachments (images, files)',
    nullable: true,
  })
  attachments?: MessageAttachment[] | null;

  @ApiPropertyOptional({
    type: Date,
    example: '2025-12-20T10:30:00Z',
    description: 'When the message was read',
    nullable: true,
  })
  read_at?: Date | null;

  @ApiProperty({
    type: Date,
    example: '2025-12-20T10:00:00Z',
    description: 'When the message was sent',
  })
  created_at: Date;

  @Exclude()
  __entity?: string;
}
