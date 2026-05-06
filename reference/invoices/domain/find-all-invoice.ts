import { ApiProperty } from '@nestjs/swagger';
import { Invoice } from './invoice';

/**
 * Find all invoices result type with pagination
 */
export class FindAllInvoice {
  @ApiProperty({
    type: [Invoice],
    description: 'List of invoices',
  })
  data: Invoice[];

  @ApiProperty({
    example: 100,
    description: 'Total count of invoices',
  })
  totalCount: number;

  @ApiProperty({
    example: 0,
    description: 'Number of records skipped',
  })
  skip: number;

  @ApiProperty({
    example: 20,
    description: 'Number of records to take',
  })
  take: number;
}
