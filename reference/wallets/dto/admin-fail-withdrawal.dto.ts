import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AdminFailWithdrawalDto {
  @ApiProperty({ example: 'Account number not found at BPI' })
  @IsString()
  @MinLength(5)
  reason: string;
}
