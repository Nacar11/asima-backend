import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO for customer replying to a provider's dispute response.
 *
 * @version 1
 * @since 1.0.0
 */
export class CustomerReplyDisputeDto {
  @ApiProperty({
    type: String,
    example:
      'I disagree with the provider response. The issue was not resolved...',
    description: 'Customer reply to provider response',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  reply: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional evidence/attachment URLs for this reply',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachment_urls?: string[];
}
