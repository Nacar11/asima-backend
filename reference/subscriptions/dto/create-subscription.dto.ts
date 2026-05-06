import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsDateString } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  plan_id: number;

  @ApiPropertyOptional({ type: String, example: '2025-12-12' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ type: Boolean, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;
}
