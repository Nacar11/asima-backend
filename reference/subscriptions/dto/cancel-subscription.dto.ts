import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiProperty({ type: String, example: 'No longer need the service' })
  @IsString()
  @MaxLength(500)
  cancellation_reason: string;
}
