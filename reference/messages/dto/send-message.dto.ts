import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsOptional,
  IsEnum,
  IsString,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageTypeEnum } from '@/messages/enums/message-type.enum';

/**
 * DTO for message attachment.
 *
 * @version 1
 * @since 1.0.0
 */
export class MessageAttachmentDto {
  @ApiProperty({
    description: 'File URL',
    example: 'https://example.com/files/image.jpg',
  })
  @IsString()
  file_url: string;

  @ApiProperty({
    description: 'File name',
    example: 'image.jpg',
  })
  @IsString()
  file_name: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  @IsString()
  mime_type: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsInt()
  @IsPositive()
  file_size: number;

  @ApiPropertyOptional({
    description: 'Optional caption',
    example: 'Photo of completed work',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}

/**
 * DTO for sending a message.
 *
 * @version 1
 * @since 1.0.0
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  conversation_id: number;

  @ApiProperty({
    enum: MessageTypeEnum,
    example: MessageTypeEnum.TEXT,
    description: 'Message type',
  })
  @IsEnum(MessageTypeEnum)
  message_type: MessageTypeEnum;

  @ApiPropertyOptional({
    description: 'Message content (required for text messages)',
    example: 'Hello, I have a question about the service.',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({
    type: [MessageAttachmentDto],
    description: 'Message attachments (for image/file messages)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];
}
