import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSubscriptionCheckoutPaymentDto {
  @ApiProperty({ type: Number, example: 123 })
  @IsInt()
  @Min(1)
  subscription_payment_id: number;

  @ApiProperty({ type: String, example: 'gcash' })
  @IsString()
  @MaxLength(50)
  payment_method_code: string;

  @ApiPropertyOptional({ type: String, example: '127.0.0.1', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ip_address?: string;
}
