import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPickleballMerchantSubscriptionPaymentDto {
  @ApiProperty({
    example: 'Proof image is unreadable. Please resubmit a clearer screenshot.',
  })
  @IsString()
  @MaxLength(500)
  rejection_reason: string;

  @ApiPropertyOptional({
    example: 'Reference number is missing from the uploaded proof.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  review_notes?: string;
}
