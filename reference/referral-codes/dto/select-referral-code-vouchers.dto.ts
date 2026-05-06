import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SelectReferralCodeVouchersDto {
  @ApiProperty({ type: [Number], example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  voucher_ids: number[];
}
