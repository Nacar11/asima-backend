import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ConversationStatusEnum } from '@/messages/enums/conversation-status.enum';

/**
 * DTO for querying conversations.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryConversationsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    enum: ConversationStatusEnum,
    description: 'Filter by conversation status',
  })
  @IsOptional()
  @IsEnum(ConversationStatusEnum)
  status?: ConversationStatusEnum;
}
