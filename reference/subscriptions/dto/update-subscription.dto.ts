import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;

  @ApiPropertyOptional({ enum: SubscriptionStatusEnum })
  @IsOptional()
  @IsEnum(SubscriptionStatusEnum)
  status?: SubscriptionStatusEnum;
}
