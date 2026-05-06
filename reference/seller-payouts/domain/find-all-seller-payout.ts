import { ApiProperty } from '@nestjs/swagger';
import { SellerPayout } from './seller-payout';

/**
 * Result of finding all seller payouts with pagination.
 *
 * @version 1
 * @since 1.0.0
 */
export class FindAllSellerPayout {
  @ApiProperty({
    type: [SellerPayout],
    description: 'List of seller payouts',
  })
  data: SellerPayout[];

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Total count of seller payouts',
  })
  totalCount: number;
}
