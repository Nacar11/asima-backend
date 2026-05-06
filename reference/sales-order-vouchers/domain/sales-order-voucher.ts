import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserVoucher } from '@/vouchers/domain/user-voucher';

/**
 * Sales-order voucher mapping domain model.
 */
export class SalesOrderVoucher {
  @ApiProperty()
  id: number;
  @ApiProperty()
  sales_order_id: number;
  @ApiProperty()
  user_voucher_id: number;
  @ApiProperty()
  voucher_code: string;
  @ApiProperty()
  voucher_discount: number;
  @ApiProperty()
  created_at: Date;
  @ApiPropertyOptional({ type: () => UserVoucher, nullable: true })
  user_voucher?: UserVoucher | null;
}
