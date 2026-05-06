import { ApiProperty } from '@nestjs/swagger';

/**
 * Voucher service restriction domain model.
 */
export class VoucherService {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 1 })
  voucher_id: number;
  @ApiProperty({ type: Number, example: 2 })
  service_id: number;
  @ApiProperty({ type: Date })
  created_at: Date;
}
