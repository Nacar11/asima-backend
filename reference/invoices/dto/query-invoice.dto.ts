import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Query DTO for listing invoices with filters and pagination
 */
export class QueryInvoiceDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'User ID to filter invoices (for admin use)',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  user_id?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Number of records to skip',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  skip?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of records to take',
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  take?: number;

  @ApiPropertyOptional({
    example: 'DESC',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Filter by start date',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Filter by end date',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filter by seller ID',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  seller_id?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Minimum amount filter',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  min_amount?: number;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Maximum amount filter',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  max_amount?: number;

  @ApiPropertyOptional({
    example: 'INV-2024',
    description: 'Search by invoice number or order number',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
