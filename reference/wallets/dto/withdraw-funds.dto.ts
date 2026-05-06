import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive, Min } from 'class-validator';

export class WithdrawFundsDto {
  @ApiProperty({
    example: 5000,
    description: 'Withdrawal amount in PHP. Minimum ₱500.',
  })
  @Type(() => Number)
  @IsPositive()
  @Min(500, { message: 'Minimum withdrawal amount is ₱500' })
  amount: number;

  @ApiProperty({
    example: 1,
    description: 'Bank account ID to withdraw to',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  bank_account_id: number;
}
