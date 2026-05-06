import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, ValidateIf } from 'class-validator';

export class RedeemOnsiteDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Signed QR token string (from scanning)',
  })
  @ValidateIf((o) => !o.short_code)
  @IsString()
  token?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'VCH-8492-X',
    description: 'Manual shortcode entry (fallback)',
  })
  @ValidateIf((o) => !o.token)
  @IsString()
  short_code?: string;
}
