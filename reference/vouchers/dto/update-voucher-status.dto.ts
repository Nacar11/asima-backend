import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';

/**
 * DTO for updating voucher status.
 */
export class UpdateVoucherStatusDto {
  @ApiProperty({ enum: VoucherStatusEnum, example: VoucherStatusEnum.INACTIVE })
  @IsEnum(VoucherStatusEnum)
  status: VoucherStatusEnum;
}
