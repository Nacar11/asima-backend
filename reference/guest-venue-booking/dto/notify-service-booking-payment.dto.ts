import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class NotifyServiceBookingPaymentDto {
  @ApiPropertyOptional({
    type: String,
    example: 'GCASH-REF-123456',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  payment_reference?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Payment proof screenshot/receipt image. Required for first payment notification.',
  })
  @IsOptional()
  payment_proof?: any;
}
