import { ApiProperty } from '@nestjs/swagger';

/**
 * Voucher category restriction domain model.
 */
export class VoucherCategory {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 1 })
  voucher_id: number;
  @ApiProperty({ type: Number, example: 2 })
  category_id: number;
  @ApiProperty({ type: Date })
  created_at: Date;
}
