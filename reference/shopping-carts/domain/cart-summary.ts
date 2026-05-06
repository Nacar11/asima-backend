import { ApiProperty } from '@nestjs/swagger';

/**
 * Cart summary domain model containing aggregated cart information.
 *
 * This model represents the calculated summary of a shopping cart including
 * total item count and monetary totals. Used for lightweight cart updates
 * without fetching full item details.
 *
 * @version 1
 * @since 1.0.0
 */
export class CartSummary {
  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Number of line items in the cart. Use for cart badge.',
  })
  line_count: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description:
      'Total quantity of all items in the cart (sum of quantities). E.g., 2 shirts + 3 pants = 5 item_count.',
  })
  item_count: number;

  @ApiProperty({
    type: Number,
    example: 2500.5,
    description: 'Subtotal amount (sum of all item prices)',
  })
  subtotal: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Tax amount (reserved for future tax calculations)',
  })
  tax_amount: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Shipping amount (reserved for future shipping calculations)',
  })
  shipping_amount: number;

  @ApiProperty({
    type: Number,
    example: 2500.5,
    description: 'Total amount (subtotal + tax + shipping)',
  })
  total_amount: number;
}
