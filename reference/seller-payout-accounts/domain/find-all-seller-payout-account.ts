import { ApiProperty } from '@nestjs/swagger';
import { SellerPayoutAccount } from './seller-payout-account';

/**
 * Result of finding all seller payout accounts with pagination.
 *
 * @version 1
 * @since 1.0.0
 */
export class FindAllSellerPayoutAccount {
  @ApiProperty({
    type: [SellerPayoutAccount],
    description: 'List of seller payout accounts',
  })
  data: SellerPayoutAccount[];

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Total count of seller payout accounts',
  })
  totalCount: number;
}
