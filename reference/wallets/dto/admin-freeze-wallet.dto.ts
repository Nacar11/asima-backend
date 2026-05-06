import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AdminFreezeWalletDto {
  @ApiProperty({ example: 'Suspected fraudulent activity' })
  @IsString()
  @MinLength(5)
  reason: string;
}
