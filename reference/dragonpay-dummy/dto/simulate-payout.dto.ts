import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DragonPayStatusEnum } from '../enums/dragonpay-status.enum';

/**
 * Simulate Payout DTO
 * Used for testing — changes a payout's status without waiting for a real bank.
 */
export class SimulatePayoutDto {
  @ApiProperty({
    description:
      'Payout transaction ID (the TxnId used when creating the payout)',
    example: 'TXN-M2QX1-ABC123',
  })
  @IsString()
  txnId: string;

  @ApiProperty({
    enum: DragonPayStatusEnum,
    description: 'Status to simulate (S=Success, F=Failed, V=Voided)',
    example: DragonPayStatusEnum.SUCCESS,
  })
  @IsEnum(DragonPayStatusEnum)
  status: DragonPayStatusEnum;

  @ApiPropertyOptional({
    description: 'Custom processing message',
    example: 'Payout credited to account',
  })
  @IsOptional()
  @IsString()
  procMsg?: string;
}

export class SimulatePayoutResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Payout simulation completed' })
  message: string;

  @ApiProperty({ example: 'TXN-M2QX1-ABC123' })
  txnId: string;

  @ApiProperty({ example: 'DPREF-20260212-ABCD1234' })
  refNo: string;

  @ApiProperty({ enum: DragonPayStatusEnum, example: 'S' })
  simulatedStatus: DragonPayStatusEnum;
}
