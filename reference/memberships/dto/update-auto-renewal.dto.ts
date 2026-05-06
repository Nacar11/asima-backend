import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAutoRenewalDto {
  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  is_auto_renew_enabled: boolean;
}
