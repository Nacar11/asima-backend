import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { EscrowTransactionTypeEnum } from '../enums/escrow-transaction-type.enum';
import { EscrowTransactionStatusEnum } from '../enums/escrow-transaction-status.enum';

/**
 * Escrow Transaction domain model.
 *
 * Represents a money movement in/out of escrow for a booking.
 * Tracks deposits, releases, refunds, and dispute holds.
 *
 * @version 1
 * @since 1.0.0
 */
export class EscrowTransaction {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Escrow transaction ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Booking ID this transaction belongs to',
  })
  booking_id: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Booking details',
  })
  booking?: any;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Milestone ID (if transaction is for a specific milestone)',
    nullable: true,
  })
  milestone_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Milestone details',
    nullable: true,
  })
  milestone?: any;

  @ApiProperty({
    enum: EscrowTransactionTypeEnum,
    example: EscrowTransactionTypeEnum.DEPOSIT,
    description: 'Transaction type',
  })
  transaction_type: EscrowTransactionTypeEnum;

  @ApiProperty({
    type: Number,
    example: 5000.0,
    description: 'Transaction amount',
  })
  amount: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Currency ID',
    nullable: true,
  })
  currency_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Currency details',
    nullable: true,
  })
  currency?: any | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'User ID who receives the release (for release transactions)',
    nullable: true,
  })
  released_to?: number | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who receives the release',
    nullable: true,
  })
  released_to_user?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: String,
    example: 'bank_transfer',
    description: 'Release method (bank_transfer, wallet, gcash)',
    nullable: true,
  })
  release_method?: string | null;

  @ApiProperty({
    enum: EscrowTransactionStatusEnum,
    example: EscrowTransactionStatusEnum.PENDING,
    description: 'Transaction status',
    default: EscrowTransactionStatusEnum.PENDING,
  })
  status: EscrowTransactionStatusEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'REF123456',
    description: 'Reference number',
    nullable: true,
  })
  reference_number?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Milestone 1 payment release',
    description: 'Transaction notes',
    nullable: true,
  })
  notes?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'User ID who processed this transaction',
    nullable: true,
  })
  processed_by?: number | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who processed this transaction',
    nullable: true,
  })
  processed_by_user?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'When transaction was processed',
    nullable: true,
  })
  processed_at?: Date | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this transaction',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated this transaction',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:05:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @Exclude()
  __entity?: string;
}
