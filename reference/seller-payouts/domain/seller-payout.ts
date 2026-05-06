import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { PayoutStatusEnum } from '../enums/payout-status.enum';

/**
 * Seller Payout domain model.
 *
 * Represents a payout request and processing for a seller.
 *
 * @version 1
 * @since 1.0.0
 */
export class SellerPayout {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller payout ID',
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID',
  })
  seller_id: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Seller details',
  })
  seller?: any;

  @ApiProperty({
    type: String,
    example: 'PO-20241211-1234',
    description: 'Payout number',
  })
  payout_number: string;

  @ApiProperty({
    type: Number,
    example: 5000.0,
    description: 'Payout amount',
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

  @ApiProperty({
    type: String,
    example: 'bank_transfer',
    description: 'Payout method',
  })
  payout_method: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Bank of the Philippines',
    description: 'Bank name',
    nullable: true,
  })
  bank_name?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '1234567890',
    description: 'Account number',
    nullable: true,
  })
  account_number?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'John Doe',
    description: 'Account name',
    nullable: true,
  })
  account_name?: string | null;

  @ApiProperty({
    enum: PayoutStatusEnum,
    example: PayoutStatusEnum.PENDING,
    description: 'Payout status',
    default: PayoutStatusEnum.PENDING,
  })
  status: PayoutStatusEnum;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'When payout was processed',
    nullable: true,
  })
  processed_at?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Insufficient funds',
    description: 'Failure reason if payout failed',
    nullable: true,
  })
  failure_reason?: string | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this payout',
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
    description: 'User who last updated this payout',
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
