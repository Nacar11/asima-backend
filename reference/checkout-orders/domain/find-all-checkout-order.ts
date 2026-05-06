import { ApiProperty } from '@nestjs/swagger';
import { CheckoutOrder } from './checkout-order';

/**
 * Find all checkout orders query result.
 *
 * Used for paginated responses when querying checkout orders.
 *
 * @version 1
 * @since 1.0.0
 */
export class FindAllCheckoutOrder {
  @ApiProperty({
    type: [CheckoutOrder],
    description: 'Array of checkout orders',
  })
  data: CheckoutOrder[];

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Total count of checkout orders matching the query',
  })
  totalCount: number;
}
