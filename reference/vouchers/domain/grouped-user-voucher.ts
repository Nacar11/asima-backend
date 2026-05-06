import { ApiProperty } from '@nestjs/swagger';
import { UserVoucher } from '@/vouchers/domain/user-voucher';

export class GroupedUserVoucher {
  @ApiProperty({ type: String, example: 'FREECOURT1HOUR' })
  code: string;

  @ApiProperty({ type: Number, example: 3 })
  available_count: number;

  @ApiProperty({ type: Number, example: 2 })
  used_count: number;

  @ApiProperty({ type: Number, example: 1 })
  expired_count: number;

  @ApiProperty({ type: () => [UserVoucher] })
  vouchers: UserVoucher[];
}
