import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateReferralCodeResponseDto {
  @ApiProperty({ type: Boolean })
  is_valid: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;
}
