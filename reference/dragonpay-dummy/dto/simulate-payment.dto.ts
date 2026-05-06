import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DragonPayStatusEnum } from '../enums/dragonpay-status.enum';

/**
 * Simulate Payment DTO
 * Used for testing - simulates a payment callback
 */
export class SimulatePaymentDto {
  @ApiProperty({
    type: String,
    description: 'Transaction ID to simulate payment for',
    example: 'TXN-20260102-0001',
  })
  @IsString()
  txnid: string;

  @ApiProperty({
    enum: DragonPayStatusEnum,
    description: 'Status to simulate (S=Success, F=Failed)',
    example: DragonPayStatusEnum.SUCCESS,
  })
  @IsEnum(DragonPayStatusEnum)
  status: DragonPayStatusEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'Custom message',
    example: 'Payment completed successfully',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Delay in milliseconds before sending callback',
    example: 2000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  delay?: number;
}

/**
 * Simulate Payment Response DTO
 */
export class SimulatePaymentResponseDto {
  @ApiProperty({
    type: Boolean,
    description: 'Whether simulation was triggered successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    type: String,
    description: 'Status message',
    example: 'Payment simulation queued',
  })
  message: string;

  @ApiProperty({
    type: String,
    description: 'Transaction ID that was simulated',
    example: 'TXN-20260102-0001',
  })
  txnid: string;

  @ApiProperty({
    type: String,
    description: 'Reference number',
    example: 'DPREF-20260102-ABC123',
  })
  refNo: string;

  @ApiProperty({
    enum: DragonPayStatusEnum,
    description: 'Simulated status',
    example: DragonPayStatusEnum.SUCCESS,
  })
  simulatedStatus: DragonPayStatusEnum;
}
