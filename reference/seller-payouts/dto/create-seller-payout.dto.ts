import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';

/**
 * DTO for creating a seller payout request.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateSellerPayoutDto {
  @ApiProperty({
    description: 'Seller ID',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  seller_id: number;

  @ApiProperty({
    description: 'Payout amount',
    example: 5000.0,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Currency ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  currency_id?: number;

  @ApiProperty({
    description: 'Payout method',
    example: 'bank_transfer',
    enum: ['bank_transfer', 'gcash', 'maya', 'paypal'],
  })
  @IsString()
  @IsIn(['bank_transfer', 'gcash', 'maya', 'paypal'])
  payout_method: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'Bank of the Philippines',
  })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({
    description: 'Account number',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  account_number?: string;

  @ApiPropertyOptional({
    description: 'Account name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  account_name?: string;
}
