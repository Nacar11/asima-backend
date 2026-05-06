import { ApiPropertyOptional } from '@nestjs/swagger';
import { Voucher } from '@/vouchers/domain/voucher';

type AppliedVoucherValidation = {
  is_valid: boolean;
  voucher_id: number;
  voucher_code: string;
  discount_amount: number;
  remaining_subtotal: number;
};

/**
 * Voucher validation result for checkout.
 */
export class VoucherValidationResult {
  @ApiPropertyOptional({ type: Boolean, nullable: true, example: true })
  is_valid?: boolean;
  @ApiPropertyOptional({ type: String, nullable: true })
  message?: string;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 150 })
  item_discount_amount?: number;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 120 })
  shipping_fee?: number;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 100 })
  shipping_fee_discount?: number;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 100 })
  discount_amount?: number;
  @ApiPropertyOptional({ type: () => Voucher, nullable: true })
  voucher?: Voucher;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1200 })
  original_subtotal?: number;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 180 })
  total_discount_amount?: number;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1020 })
  final_payable_amount?: number;
  @ApiPropertyOptional({ type: Boolean, nullable: true, example: false })
  include_addons_flag?: boolean;

  @ApiPropertyOptional({
    type: 'array',
    nullable: true,
    items: {
      type: 'object',
      properties: {
        is_valid: { type: 'boolean', example: true },
        voucher_id: { type: 'number', example: 10 },
        voucher_code: { type: 'string', example: 'WELCOME100' },
        discount_amount: { type: 'number', example: 100 },
        remaining_subtotal: { type: 'number', example: 1100 },
      },
    },
  })
  applied_vouchers?: AppliedVoucherValidation[];
}
