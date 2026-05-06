import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Customer requested cancellation',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    description: 'Notes explaining the status change',
    example: 'Refund will be processed within 3-5 business days',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  status_notes?: string;
}
