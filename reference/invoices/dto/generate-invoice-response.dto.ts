import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for invoice generation
 * Per PRD: Returns invoice_id, invoice_number, and pdf_url
 */
export class GenerateInvoiceResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Generated invoice ID',
  })
  invoice_id: number;

  @ApiProperty({
    example: 'INV-2024-12-00001',
    description: 'Unique invoice number',
  })
  invoice_number: string;

  @ApiProperty({
    example: '/api/v1/invoices/1/download',
    description: 'URL to download the invoice PDF',
  })
  pdf_url: string;
}
