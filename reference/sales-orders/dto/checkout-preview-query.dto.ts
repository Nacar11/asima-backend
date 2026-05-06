import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsArray,
  IsString,
  IsIn,
  Length,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Query parameters for checkout preview
 */
export class CheckoutPreviewQueryDto {
  @ApiPropertyOptional({
    enum: ['delivery', 'pickup'],
    description: 'Fulfillment type. Use "pickup" to skip shipping calculation.',
    example: 'delivery',
    default: 'delivery',
  })
  @IsOptional()
  @IsIn(['delivery', 'pickup'])
  fulfillment_type?: 'delivery' | 'pickup';

  @ApiPropertyOptional({
    type: Number,
    description:
      'Address ID for shipping calculation. If not provided, uses default address.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  address_id?: number;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Shipping method ID. If not provided, uses first active method from default provider.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shipping_method_id?: number;

  @ApiPropertyOptional({
    type: String,
    description:
      'Comma-separated voucher IDs to apply via query parameter vouchers (e.g. vouchers=1,2,3). User must have claimed these vouchers. Multiple vouchers can be stacked. Cannot be used together with voucher_code.',
    example: '1,2,3',
  })
  @ValidateIf((o) => !o.voucher_code)
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id: string) => parseInt(id.trim(), 10));
    }
    if (Array.isArray(value)) {
      return value.map((id: string | number) =>
        typeof id === 'string' ? parseInt(id, 10) : id,
      );
    }
    return value;
  })
  vouchers?: number[];

  @ApiPropertyOptional({
    type: String,
    description:
      'Voucher code to claim and apply. If valid and eligible, the voucher will be automatically claimed for the user and applied to the checkout. Cannot be used together with vouchers.',
    example: 'WELCOME50',
  })
  @ValidateIf((o) => !o.vouchers || o.vouchers.length === 0)
  @IsOptional()
  @IsString()
  @Length(1, 20)
  voucher_code?: string;
}
