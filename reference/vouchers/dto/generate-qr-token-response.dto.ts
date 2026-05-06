import { ApiProperty } from '@nestjs/swagger';

export class GenerateQrTokenResponseDto {
  @ApiProperty({
    type: String,
    description: 'Signed JWT token to encode as QR code',
  })
  token: string;

  @ApiProperty({
    type: String,
    example: 'VCH-8492-X',
    description: 'Human-readable fallback code displayed below the QR',
  })
  short_code: string;

  @ApiProperty({
    type: Date,
    description: 'Token expiration time (5 minutes from generation)',
  })
  expires_at: Date;
}
