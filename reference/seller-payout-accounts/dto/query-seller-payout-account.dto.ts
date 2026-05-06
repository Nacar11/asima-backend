import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsIn,
  IsBoolean,
} from 'class-validator';

/**
 * DTO for querying seller payout accounts with filters and pagination.
 *
 * @version 1
 * @since 1.0.0
 */
export class QuerySellerPayoutAccountDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by seller ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seller_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by account type',
    example: 'bank_transfer',
    enum: ['bank_transfer', 'gcash', 'maya', 'paypal'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['bank_transfer', 'gcash', 'maya', 'paypal'])
  account_type?: string;

  @ApiPropertyOptional({
    description: 'Filter by default account',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}
