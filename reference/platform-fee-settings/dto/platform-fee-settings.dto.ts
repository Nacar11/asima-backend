import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class PlatformFeeSettingsDto {
  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Default platform fee percentage applied to bookings',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  platform_fee_percent: number;
}
