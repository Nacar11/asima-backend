import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsPositive,
} from 'class-validator';
import { EscrowTransactionStatusEnum } from '../enums/escrow-transaction-status.enum';

/**
 * DTO for updating an escrow transaction.
 *
 * Used to update transaction status, notes, or processing information.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateEscrowTransactionDto {
  @ApiPropertyOptional({
    description: 'Transaction status',
    enum: EscrowTransactionStatusEnum,
    example: EscrowTransactionStatusEnum.COMPLETED,
  })
  @IsOptional()
  @IsEnum(EscrowTransactionStatusEnum)
  status?: EscrowTransactionStatusEnum;

  @ApiPropertyOptional({
    description: 'Reference number',
    example: 'REF123456',
  })
  @IsOptional()
  @IsString()
  reference_number?: string;

  @ApiPropertyOptional({
    description: 'Transaction notes',
    example: 'Processed successfully',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'User ID who processed this transaction',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  processed_by?: number;

  @ApiPropertyOptional({
    description: 'When transaction was processed',
    example: '2024-12-11T09:00:00Z',
  })
  @IsOptional()
  processed_at?: Date;
}
