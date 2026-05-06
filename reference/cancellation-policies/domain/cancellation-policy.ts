import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Cancellation Policy domain entity
 */
export class CancellationPolicy {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1 })
  seller_id?: number | null;

  @ApiPropertyOptional({
    type: () => Object,
    nullable: true,
    example: { id: 1, store_name: 'Tech Store' },
  })
  seller?: { id: number; store_name: string } | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1 })
  service_id?: number | null;

  @ApiPropertyOptional({
    type: () => Object,
    nullable: true,
    example: { id: 1, title: 'Aircon Cleaning' },
  })
  service?: { id: number; title: string } | null;

  @ApiProperty({ type: String, example: 'Standard Policy' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 48,
    description: 'Hours before booking for free cancellation',
  })
  free_cancel_hours: number;

  @ApiProperty({
    type: Number,
    example: 24,
    description: 'Hours before booking for partial refund',
  })
  partial_cancel_hours: number;

  @ApiProperty({
    type: Number,
    example: 50,
    description: 'Partial refund percentage (customer keeps this %)',
  })
  partial_cancel_percent: number;

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'No-show charge percentage',
  })
  no_show_charge_percent: number;

  @ApiProperty({ type: String, example: 'Active' })
  status: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @Exclude()
  __entity?: string;
}
