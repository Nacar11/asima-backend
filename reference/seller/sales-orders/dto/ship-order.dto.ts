import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ShipOrderDto {
  @ApiPropertyOptional({
    description:
      'Tracking number for the shipment (auto-filled for in-house delivery if not provided)',
    example: 'TRK123456789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tracking_number?: string;

  @ApiPropertyOptional({
    description:
      'Shipping provider name (auto-filled as "In-House Delivery" if not provided)',
    example: 'FedEx',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  shipping_provider?: string;

  @ApiPropertyOptional({
    description: 'Notes explaining the status change',
    example: 'Shipped via express due to customer request',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  status_notes?: string;
}
