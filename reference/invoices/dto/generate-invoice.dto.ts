import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO for generating an invoice
 */
export class GenerateInvoiceDto {
  @ApiProperty({
    example: 1,
    description: 'Order ID to generate invoice for',
  })
  @IsNotEmpty()
  @IsNumber()
  order_id: number;
}
