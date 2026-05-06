import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ProcessPaymentDto {
  @ApiProperty({ type: String, example: 'pi_1234567890' })
  @IsString()
  transaction_id: string;

  @ApiPropertyOptional({ type: String, example: 'gcash' })
  @IsOptional()
  @IsString()
  payment_method?: string;
}
