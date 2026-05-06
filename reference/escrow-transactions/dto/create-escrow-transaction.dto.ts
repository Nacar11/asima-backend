import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { EscrowTransactionTypeEnum } from '../enums/escrow-transaction-type.enum';

/**
 * DTO for creating an escrow transaction.
 *
 * Used when creating deposits, releases, refunds, or dispute holds.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateEscrowTransactionDto {
  @ApiProperty({
    description: 'Booking ID this transaction belongs to',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  booking_id: number;

  @ApiPropertyOptional({
    description: 'Milestone ID (if transaction is for a specific milestone)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  milestone_id?: number;

  @ApiProperty({
    description: 'Transaction type',
    example: EscrowTransactionTypeEnum.DEPOSIT,
    enum: EscrowTransactionTypeEnum,
  })
  @IsEnum(EscrowTransactionTypeEnum)
  transaction_type: EscrowTransactionTypeEnum;

  @ApiProperty({
    description: 'Transaction amount',
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

  @ApiPropertyOptional({
    description: 'User ID who receives the release (for release transactions)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  released_to?: number;

  @ApiPropertyOptional({
    description: 'Release method (bank_transfer, wallet, gcash)',
    example: 'bank_transfer',
  })
  @IsOptional()
  @IsString()
  release_method?: string;

  @ApiPropertyOptional({
    description: 'Reference number',
    example: 'REF123456',
  })
  @IsOptional()
  @IsString()
  reference_number?: string;

  @ApiPropertyOptional({
    description: 'Transaction notes',
    example: 'Milestone 1 payment release',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
