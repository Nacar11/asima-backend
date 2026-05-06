import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class NotifyMembershipPaymentDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  payment_reference?: string;
}
