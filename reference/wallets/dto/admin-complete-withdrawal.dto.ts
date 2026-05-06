import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AdminCompleteWithdrawalDto {
  @ApiProperty({
    example: 'BPI-REF-20260212-001',
    description: 'Bank reference number after transfer',
  })
  @IsString()
  @MinLength(3)
  bank_reference_number: string;
}
