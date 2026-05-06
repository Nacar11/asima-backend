import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

/**
 * Input payload for collecting a voucher using its exact voucher code.
 */
export class CollectVoucherByCodeDto {
  @ApiProperty({
    type: String,
    example: 'WELCOME50',
    description: 'Exact voucher code to claim',
  })
  @IsString()
  @Length(1, 20)
  voucher_code: string;
}
