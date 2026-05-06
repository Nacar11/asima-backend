import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScanVoucherResponseDto {
  @ApiProperty({ type: Number })
  user_voucher_id: number;

  @ApiProperty({ type: String, example: 'John Doe' })
  customer_name: string;

  @ApiProperty({ type: String, example: 'COFFEEPCT15' })
  voucher_code: string;

  @ApiProperty({ type: String, example: 'percentage' })
  discount_type: string;

  @ApiProperty({ type: Number, example: 15 })
  discount_value: number;

  @ApiProperty({ type: Number, example: 0 })
  min_order_amount: number;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 100 })
  max_discount_cap: number | null;
}
