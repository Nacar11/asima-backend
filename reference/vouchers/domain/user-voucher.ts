import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserVoucherStatusEnum } from '@/vouchers/enums/user-voucher-status.enum';
import { Voucher } from '@/vouchers/domain/voucher';

/**
 * User voucher domain model.
 */
export class UserVoucher {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 1 })
  user_id: number;
  @ApiProperty({ type: Number, example: 1 })
  voucher_id: number;
  @ApiProperty({ type: Date })
  collected_at: Date;
  @ApiProperty({
    enum: UserVoucherStatusEnum,
    example: UserVoucherStatusEnum.AVAILABLE,
  })
  status: UserVoucherStatusEnum;
  @ApiPropertyOptional({ type: Date, nullable: true })
  used_at?: Date | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  expired_at?: Date | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  expires_at?: Date | null;
  @ApiProperty({ type: Date })
  created_at: Date;
  @ApiProperty({ type: Date })
  updated_at: Date;
  @ApiPropertyOptional({ type: () => Voucher, nullable: true })
  voucher?: Voucher;
  @ApiPropertyOptional({
    description: 'Customer who owns this voucher (included in QR token lookup)',
  })
  user?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    profile_picture: string | null;
  };
}
