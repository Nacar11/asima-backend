import { ApiProperty } from '@nestjs/swagger';
import { SellerEarning } from './seller-earning';

/**
 * Result of finding all seller earnings with pagination.
 *
 * @version 1
 * @since 1.0.0
 */
export class FindAllSellerEarning {
  @ApiProperty({
    type: [SellerEarning],
    description: 'List of seller earnings',
  })
  data: SellerEarning[];

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Total count of seller earnings',
  })
  totalCount: number;
}
