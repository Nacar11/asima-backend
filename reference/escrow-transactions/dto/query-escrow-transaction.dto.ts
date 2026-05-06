import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsPositive, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EscrowTransactionTypeEnum } from '../enums/escrow-transaction-type.enum';
import { EscrowTransactionStatusEnum } from '../enums/escrow-transaction-status.enum';

/**
 * DTO for querying escrow transactions.
 *
 * Used for filtering and paginating escrow transactions.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryEscrowTransactionDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by booking ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  booking_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by milestone ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  milestone_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: EscrowTransactionTypeEnum,
    example: EscrowTransactionTypeEnum.RELEASE,
  })
  @IsOptional()
  @IsEnum(EscrowTransactionTypeEnum)
  transaction_type?: EscrowTransactionTypeEnum;

  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    enum: EscrowTransactionStatusEnum,
    example: EscrowTransactionStatusEnum.COMPLETED,
  })
  @IsOptional()
  @IsEnum(EscrowTransactionStatusEnum)
  status?: EscrowTransactionStatusEnum;
}
