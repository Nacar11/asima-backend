import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitPickleballMerchantSubscriptionPaymentDto {
  @ApiPropertyOptional({
    example: 'gcash',
    description: 'Merchant-selected payment method label.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  payment_method?: string;

  @ApiPropertyOptional({
    example: 'REF-20260423-001',
    description: 'Reference number from the submitted payment proof.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  payment_reference_number?: string;

  @ApiProperty({
    description:
      'Base64-encoded image proof for the merchant subscription payment.',
  })
  @IsString()
  payment_proof_base64: string;
}
