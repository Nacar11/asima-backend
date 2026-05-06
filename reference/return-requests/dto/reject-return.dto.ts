import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectReturnDto {
  @ApiProperty({
    description: 'Rejection reason',
    example: 'Return window has expired',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  rejection_reason: string;
}
