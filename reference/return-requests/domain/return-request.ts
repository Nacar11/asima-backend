import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Causer } from '@/utils/domain/causer';
import { ReturnRequestStatusEnum } from './return-request-status.enum';
import { ReturnRequestItem } from './return-request-item';
import { ReturnRequestMediaMapping } from '@/media/domain/return-request-media-mapping';
import { OrderTrackingEvent } from '@/order-tracking/domain/order-tracking-event';

export class ReturnRequest {
  @ApiProperty({
    description: 'Return request ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Order ID',
    example: 1,
  })
  order_id: number;

  @ApiPropertyOptional({
    description: 'Order details',
    type: 'object',
  })
  order?: {
    id: number;
    order_number: string;
    status: string;
  };

  @ApiProperty({
    description: 'User ID (customer)',
    example: 1,
  })
  user_id: number;

  @ApiPropertyOptional({
    description: 'User details',
    type: 'object',
  })
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };

  @ApiPropertyOptional({
    description: 'Seller ID',
    example: 1,
  })
  seller_id?: number | null;

  @ApiPropertyOptional({
    description: 'Seller details',
    type: 'object',
  })
  seller?: {
    id: number;
    store_name: string;
  };

  @ApiProperty({
    description: 'Unique return request number',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  return_number: string;

  @ApiProperty({
    description: 'Return request status',
    enum: ReturnRequestStatusEnum,
    example: ReturnRequestStatusEnum.PENDING,
  })
  status: ReturnRequestStatusEnum;

  @ApiProperty({
    description: 'Reason for return',
    example: 'Product damaged during shipping',
  })
  reason: string;

  @ApiPropertyOptional({
    description: 'Reason for rejection (if rejected)',
    example: 'Return window has expired',
  })
  rejection_reason?: string | null;

  @ApiPropertyOptional({
    description: 'Notes from seller when approving',
  })
  approval_notes?: string | null;

  @ApiProperty({
    description: 'Order status before return was requested',
    example: 'delivered',
  })
  previous_order_status: string;

  @ApiPropertyOptional({
    description: 'Timestamp when pickup was scheduled',
  })
  pickup_scheduled_at?: Date | null;

  @ApiPropertyOptional({
    description: 'Scheduled date/time for pickup',
  })
  pickup_scheduled_date?: Date | null;

  @ApiPropertyOptional({
    description: 'User ID who scheduled the pickup',
  })
  pickup_scheduled_by?: number | null;

  @ApiPropertyOptional({
    description: 'Notes for the pickup driver',
  })
  pickup_notes?: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when item was picked up from customer',
  })
  picked_up_at?: Date | null;

  @ApiPropertyOptional({
    description: 'User ID who marked the item as picked up',
  })
  picked_up_by?: number | null;

  @ApiPropertyOptional({
    description: 'Calculated refund amount based on returned items',
    example: 150.0,
  })
  calculated_refund_amount?: number | null;

  @ApiPropertyOptional({
    description: 'Actual refund amount (may differ from calculated)',
    example: 150.0,
  })
  actual_refund_amount?: number | null;

  @ApiPropertyOptional({
    description: 'Notes about the refund',
  })
  refund_notes?: string | null;

  @ApiProperty({
    description: 'Timestamp when return was requested',
  })
  requested_at: Date;

  @ApiPropertyOptional({
    description: 'Timestamp when return was approved',
  })
  approved_at?: Date | null;

  @ApiPropertyOptional({
    description: 'User ID who approved the return',
  })
  approved_by?: number | null;

  @ApiPropertyOptional({
    description: 'Timestamp when return was rejected',
  })
  rejected_at?: Date | null;

  @ApiPropertyOptional({
    description: 'User ID who rejected the return',
  })
  rejected_by?: number | null;

  @ApiPropertyOptional({
    description: 'Timestamp when returned items were received',
  })
  received_at?: Date | null;

  @ApiPropertyOptional({
    description: 'User ID who marked items as received',
  })
  received_by?: number | null;

  @ApiPropertyOptional({
    description: 'Timestamp when refund was processed',
  })
  refunded_at?: Date | null;

  @ApiPropertyOptional({
    description: 'User ID who processed the refund',
  })
  refunded_by?: number | null;

  // ==================== Payment Refund Tracking ====================

  @ApiPropertyOptional({
    description: 'Payment refund status',
    example: 'pending',
  })
  payment_refund_status?: string | null;

  @ApiPropertyOptional({
    description: 'Payment refund disbursement method (cash, wallet)',
    example: 'cash',
  })
  payment_refund_method?: string | null;

  @ApiPropertyOptional({
    description: 'Payment refund amount',
    example: 150.0,
  })
  payment_refund_amount?: number | null;

  @ApiPropertyOptional({
    description: 'Timestamp when payment refund was processed',
  })
  payment_refund_at?: Date | null;

  @ApiPropertyOptional({
    description: 'User ID who processed the payment refund',
  })
  payment_refund_by?: number | null;

  @ApiPropertyOptional({
    description: 'Payment refund reference from gateway',
  })
  payment_refund_reference?: string | null;

  // ==================== End Payment Refund Tracking ====================

  @ApiPropertyOptional({
    description: 'Items being returned',
    type: [ReturnRequestItem],
  })
  items?: ReturnRequestItem[];

  @ApiPropertyOptional({
    description: 'Evidence images attached to this return request',
  })
  media_mappings?: ReturnRequestMediaMapping[];

  @ApiPropertyOptional({
    description: 'Timeline of return-related tracking events',
    type: [OrderTrackingEvent],
  })
  timeline?: OrderTrackingEvent[];

  @ApiPropertyOptional({
    description: 'User who created this return request',
  })
  created_by?: Causer;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    description: 'User who last updated this return request',
  })
  updated_by?: Causer;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'User who deleted this return request',
  })
  deleted_by?: Causer;

  @ApiPropertyOptional({
    description: 'Soft delete timestamp',
  })
  deleted_at?: Date | null;
}
