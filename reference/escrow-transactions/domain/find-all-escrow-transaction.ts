import { ApiProperty } from '@nestjs/swagger';
import { EscrowTransaction } from './escrow-transaction';

/**
 * Find all escrow transactions result.
 *
 * @version 1
 * @since 1.0.0
 */
export class FindAllEscrowTransaction {
  @ApiProperty({
    type: [EscrowTransaction],
    description: 'List of escrow transactions',
  })
  data: EscrowTransaction[];

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Total count of escrow transactions',
  })
  totalCount: number;
}
