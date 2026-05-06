import { ApiProperty } from '@nestjs/swagger';
import { BankAccount } from './bank-account';

/**
 * Paginated response for bank accounts
 */
export class FindAllBankAccount {
  @ApiProperty({
    type: () => [BankAccount],
    description: 'List of bank accounts',
  })
  data: BankAccount[];

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Total count of bank accounts',
  })
  totalCount: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Number of records skipped',
  })
  skip: number;

  @ApiProperty({
    type: Number,
    example: 20,
    description: 'Number of records taken',
  })
  take: number;
}
