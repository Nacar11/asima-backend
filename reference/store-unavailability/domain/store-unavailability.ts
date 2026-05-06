import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Seller } from '@/sellers/domain/seller';
import { User } from '@/users/domain/user';

/**
 * Store Unavailability Domain.
 *
 * Represents time blocks when a seller is unavailable for bookings.
 * Simplified: No member-specific unavailability (seller is the provider).
 *
 * @version 2
 * @since 1.0.0
 */
export class StoreUnavailability {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  seller_id: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description:
      'Optional service/venue scope. Null means seller-wide unavailability.',
  })
  service_id?: number | null;

  @ApiProperty({ type: String, format: 'date' })
  unavailable_date: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2025-12-26',
    nullable: true,
  })
  end_date?: string | null;

  @ApiPropertyOptional({ type: String, example: '09:00:00', nullable: true })
  start_time?: string | null;

  @ApiPropertyOptional({ type: String, example: '18:00:00', nullable: true })
  end_time?: string | null;

  @ApiProperty({ type: Boolean, default: true })
  is_full_day: boolean;

  @ApiPropertyOptional({ type: String, maxLength: 255, nullable: true })
  reason?: string | null;

  @ApiProperty({
    type: String,
    default: 'maintenance',
    description: 'Block type: maintenance or open_play',
  })
  block_type: string;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Linked open play event id when block_type=open_play',
  })
  open_play_event_id?: number | null;

  @ApiProperty({ type: String, default: 'Active' })
  status: string;

  @ApiPropertyOptional({ type: () => Seller, nullable: true })
  seller?: Seller | null;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional()
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
