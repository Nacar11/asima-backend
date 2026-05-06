import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type DisputeMessageSenderRole = 'customer' | 'seller' | 'admin';

/**
 * DisputeMessage domain model.
 *
 * Represents a single message in a dispute conversation thread
 * between customer, seller, and admin.
 *
 * @version 1
 * @since 1.0.0
 */
export class DisputeMessage {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  dispute_id: number;

  @ApiProperty({ type: Number, example: 1 })
  sender_id: number;

  @ApiPropertyOptional({ type: Object })
  sender?: { id: number; first_name: string; last_name: string } | null;

  @ApiProperty({ enum: ['customer', 'seller', 'admin'], example: 'customer' })
  sender_role: DisputeMessageSenderRole;

  @ApiProperty({ type: String, example: 'I would like to clarify...' })
  message: string;

  @ApiPropertyOptional({ type: [String], nullable: true })
  attachment_urls?: string[] | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiProperty({ type: Date })
  updated_at: Date;
}
