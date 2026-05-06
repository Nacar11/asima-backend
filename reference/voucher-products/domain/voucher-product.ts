import { ApiProperty } from '@nestjs/swagger';

/**
 * Voucher product restriction domain model.
 */
export class VoucherProduct {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 1 })
  voucher_id: number;
  @ApiProperty({ type: Number, example: 2 })
  product_id: number;
  @ApiProperty({ type: Date })
  created_at: Date;
}
