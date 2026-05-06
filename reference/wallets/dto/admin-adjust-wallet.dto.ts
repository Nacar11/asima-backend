import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsPositive, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';

export class AdminAdjustWalletDto {
  @ApiProperty({ example: 500, description: 'Adjustment amount in PHP' })
  @Type(() => Number)
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: TransactionDirectionEnum })
  @IsEnum(TransactionDirectionEnum)
  direction: TransactionDirectionEnum;

  @ApiProperty({ example: 'Manual correction for return shortfall' })
  @IsString()
  @MinLength(5)
  reason: string;
}
