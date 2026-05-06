import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Body for PATCH sellers/vouchers/:id/gift.
 * Auto-collects the voucher for each specified user (creates user_voucher records).
 */
export class GiftVoucherToUsersDto {
  @ApiProperty({
    type: [Number],
    example: [101, 102],
    description:
      'User IDs to gift the voucher to (voucher will be collected for each user)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  user_ids: number[];

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Number of voucher copies to gift to each user (default: 1)',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  quantity_per_user: number;
}
