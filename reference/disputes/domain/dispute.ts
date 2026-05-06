import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { DisputeStatusEnum } from '../enums/dispute-status.enum';
import { DisputeReasonEnum } from '../enums/dispute-reason.enum';
import { DisputeResolutionEnum } from '../enums/dispute-resolution.enum';

/**
 * Dispute domain model.
 *
 * Represents a customer-initiated dispute on a completed booking.
 * Tracks the dispute lifecycle from filing through resolution.
 *
 * @version 1
 * @since 1.0.0
 */
export class Dispute {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  booking_id: number;

  @ApiPropertyOptional({ type: Object })
  booking?: any;

  @ApiProperty({ type: Number, example: 1 })
  customer_id: number;

  @ApiPropertyOptional({ type: Object })
  customer?: any;

  @ApiProperty({ type: Number, example: 1 })
  seller_id: number;

  @ApiPropertyOptional({ type: Object })
  seller?: any;

  @ApiPropertyOptional({ type: String, example: 'DSP-20260211-1234' })
  dispute_number?: string | null;

  @ApiProperty({ enum: DisputeStatusEnum, example: DisputeStatusEnum.OPEN })
  status: DisputeStatusEnum;

  @ApiProperty({
    enum: DisputeReasonEnum,
    example: DisputeReasonEnum.POOR_QUALITY,
  })
  reason: DisputeReasonEnum;

  @ApiProperty({
    type: String,
    example: 'The service was not completed properly.',
  })
  description: string;

  @ApiPropertyOptional({ type: [String], nullable: true })
  evidence_urls?: string[] | null;

  @ApiPropertyOptional({ enum: DisputeResolutionEnum, nullable: true })
  requested_resolution?: DisputeResolutionEnum | null;

  @ApiPropertyOptional({ type: Number, example: 500.0, nullable: true })
  requested_refund_amount?: number | null;

  // --- Resolution fields ---

  @ApiPropertyOptional({ enum: DisputeResolutionEnum, nullable: true })
  resolution?: DisputeResolutionEnum | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  resolution_notes?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  resolved_by?: number | null;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  resolved_by_user?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  resolved_at?: Date | null;

  @ApiProperty({ type: Number, example: 0, default: 0 })
  refund_amount: number;

  // --- Provider response fields ---

  @ApiPropertyOptional({ type: String, nullable: true })
  provider_response?: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  provider_evidence_urls?: string[] | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  provider_responded_at?: Date | null;

  // --- Customer reply fields (reply to provider response) ---

  @ApiPropertyOptional({ type: String, nullable: true })
  customer_reply?: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  customer_replied_at?: Date | null;

  // --- Audit ---

  @ApiPropertyOptional({ type: () => User })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiPropertyOptional({ type: () => User })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({ type: Date })
  updated_at: Date;

  @Exclude()
  __entity?: string;
}
