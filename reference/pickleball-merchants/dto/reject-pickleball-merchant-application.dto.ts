import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectPickleballMerchantApplicationDto {
  @ApiProperty({ example: 'Business details are incomplete.' })
  @IsString()
  @IsNotEmpty()
  rejection_reason: string;

  @ApiPropertyOptional({
    example: 'Please include the exact business address before reapplying.',
  })
  @IsOptional()
  @IsString()
  review_notes?: string;
}
