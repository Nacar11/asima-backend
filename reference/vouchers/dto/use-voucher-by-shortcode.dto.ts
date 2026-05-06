import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

/**
 * Input payload for using/redeeming a voucher via its unique shortcode
 * during an in-store physical transaction.
 */
export class UseVoucherByShortcodeDto {
  @ApiProperty({
    type: String,
    example: 'A1B2C3D4',
    description: 'The unique shortcode from the customer user voucher',
  })
  @IsString()
  @Length(1, 12)
  shortcode: string;
}
