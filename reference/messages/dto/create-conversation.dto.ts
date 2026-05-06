import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsOptional, IsEnum } from 'class-validator';
import { ContextTypeEnum } from '@/messages/enums/context-type.enum';

/**
 * DTO for creating a new conversation.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateConversationDto {
  @ApiProperty({
    description: 'Seller ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  seller_id: number;

  @ApiProperty({
    description: 'Customer user ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  customer_id: number;

  @ApiPropertyOptional({
    enum: ContextTypeEnum,
    example: ContextTypeEnum.BOOKING,
    description: 'Context type (what the conversation is about)',
  })
  @IsOptional()
  @IsEnum(ContextTypeEnum)
  context_type?: ContextTypeEnum;

  @ApiPropertyOptional({
    description: 'Context ID (booking_id, sales_order_id, etc.)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  context_id?: number;
}
