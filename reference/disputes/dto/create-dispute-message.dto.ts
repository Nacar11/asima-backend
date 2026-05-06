import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DisputeMessageSenderRole } from '../domain/dispute-message';

/**
 * DTO for posting a message in a dispute thread.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateDisputeMessageDto {
  @ApiProperty({
    type: String,
    example: 'I would like to clarify the issue further.',
    description: 'Message content',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({
    enum: ['customer', 'seller', 'admin'],
    example: 'customer',
    description: 'Role of the sender (inferred from auth if not provided)',
  })
  @IsOptional()
  @IsEnum(['customer', 'seller', 'admin'] as const)
  sender_role?: DisputeMessageSenderRole;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional attachment URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachment_urls?: string[];
}
