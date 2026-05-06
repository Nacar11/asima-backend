import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Invoice status enum
 */
export enum InvoiceStatusEnum {
  VALID = 'valid',
  VOIDED = 'voided',
}

/**
 * Invoice email status enum
 */
export enum InvoiceEmailStatusEnum {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

/**
 * Invoice domain entity
 * Represents a generated invoice for a completed order
 */
export class Invoice {
  @ApiProperty({
    example: 1,
    description: 'Invoice ID',
  })
  id: number;

  @ApiProperty({
    example: 'INV-2024-12-00001',
    description: 'Unique invoice number',
  })
  invoice_number: string;

  @ApiProperty({
    example: 1,
    description: 'Order ID',
  })
  order_id: number;

  @ApiProperty({
    example: 1,
    description: 'Seller ID',
  })
  seller_id: number;

  @ApiProperty({
    example: 1,
    description: 'User (customer) ID',
  })
  user_id: number;

  @ApiProperty({
    example: 1000.0,
    description: 'Subtotal amount',
  })
  subtotal: number;

  @ApiProperty({
    example: 120.0,
    description: 'Tax amount',
  })
  tax_amount: number;

  @ApiProperty({
    example: 50.0,
    description: 'Shipping amount',
  })
  shipping_amount: number;

  @ApiProperty({
    example: 1170.0,
    description: 'Total amount',
  })
  total_amount: number;

  @ApiProperty({
    example: 'Tech Store',
    description: 'Seller store name (snapshot)',
  })
  seller_store_name: string;

  @ApiPropertyOptional({
    example: 'BR123456789',
    description: 'Seller business registration number (snapshot)',
    nullable: true,
  })
  seller_business_registration?: string | null;

  @ApiPropertyOptional({
    example: '123-456-789-000',
    description: 'Seller tax ID (snapshot)',
    nullable: true,
  })
  seller_tax_id?: string | null;

  @ApiProperty({
    example: 'Juan Dela Cruz',
    description: 'Customer full name (snapshot)',
  })
  customer_name: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Customer email (snapshot)',
  })
  customer_email: string;

  @ApiPropertyOptional({
    example: '+639123456789',
    description: 'Customer phone (snapshot)',
    nullable: true,
  })
  customer_phone?: string | null;

  @ApiPropertyOptional({
    example: 'Juan Dela Cruz',
    description: 'Shipping recipient name',
    nullable: true,
  })
  shipping_recipient_name?: string | null;

  @ApiPropertyOptional({
    example: '123 Rizal Street',
    description: 'Shipping address line 1',
    nullable: true,
  })
  shipping_address_line1?: string | null;

  @ApiPropertyOptional({
    example: 'Barangay San Antonio',
    description: 'Shipping address line 2',
    nullable: true,
  })
  shipping_address_line2?: string | null;

  @ApiPropertyOptional({
    example: 'Makati City',
    description: 'Shipping city',
    nullable: true,
  })
  shipping_city?: string | null;

  @ApiPropertyOptional({
    example: 'Metro Manila',
    description: 'Shipping state/province',
    nullable: true,
  })
  shipping_state_province?: string | null;

  @ApiPropertyOptional({
    example: '1234',
    description: 'Shipping postal code',
    nullable: true,
  })
  shipping_postal_code?: string | null;

  @ApiPropertyOptional({
    example: 'Philippines',
    description: 'Shipping country',
    nullable: true,
  })
  shipping_country?: string | null;

  @ApiProperty({
    enum: InvoiceStatusEnum,
    example: InvoiceStatusEnum.VALID,
    description: 'Invoice status',
  })
  status: InvoiceStatusEnum;

  @ApiPropertyOptional({
    example: '/invoices/2024/12/INV-2024-12-00001.pdf',
    description: 'PDF file path in storage',
    nullable: true,
  })
  pdf_file_path?: string | null;

  @ApiPropertyOptional({
    example: '2024-12-01T10:00:00Z',
    description: 'PDF generation timestamp',
    nullable: true,
  })
  pdf_generated_at?: Date | null;

  @ApiPropertyOptional({
    example: '2024-12-01T10:00:30Z',
    description: 'Email sent timestamp',
    nullable: true,
  })
  email_sent_at?: Date | null;

  @ApiProperty({
    enum: InvoiceEmailStatusEnum,
    example: InvoiceEmailStatusEnum.PENDING,
    description: 'Email delivery status',
  })
  email_status: InvoiceEmailStatusEnum;

  @ApiProperty({
    example: 0,
    description: 'Email retry count',
  })
  email_retry_count: number;

  @ApiPropertyOptional({
    example: '2024-12-01T10:00:30Z',
    description: 'Last email attempt timestamp',
    nullable: true,
  })
  last_email_attempt_at?: Date | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'Created by user ID',
    nullable: true,
  })
  created_by?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'Updated by user ID',
    nullable: true,
  })
  updated_by?: number | null;

  @ApiProperty({
    example: '2024-12-01T10:00:00Z',
    description: 'Created timestamp',
  })
  created_at: Date;

  @ApiProperty({
    example: '2024-12-01T10:00:00Z',
    description: 'Updated timestamp',
  })
  updated_at: Date;
}
