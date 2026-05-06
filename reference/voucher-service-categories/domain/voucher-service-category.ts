import { ApiProperty } from '@nestjs/swagger';

/**
 * Voucher service-category restriction domain model.
 */
export class VoucherServiceCategory {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 1 })
  voucher_id: number;
  @ApiProperty({ type: Number, example: 2 })
  service_category_id: number;
  @ApiProperty({ type: Date })
  created_at: Date;
}
